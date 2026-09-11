<?php
namespace Lordicon;

if (!defined('ABSPATH')) {
    exit;
}

class AjaxHandler {
    /**
     * Capability required per endpoint.
     *
     * The editor endpoints ask for `edit_posts`, not `manage_options`: they exist to serve
     * the block, and anyone who may write a post may use it. Requiring `manage_options`
     * everywhere meant an Editor or Author could not insert an icon at all - the library
     * never loaded for them.
     *
     * The account endpoints stay administrator-only. They read and write the site-wide
     * Lordicon credentials, which is a different kind of decision from writing a post.
     */
    const CAPABILITIES = array(
        'icons'      => 'edit_posts',
        'variants'   => 'edit_posts',
        'status'     => 'edit_posts',
        'track'      => 'edit_posts',
        'upload'     => 'edit_posts',
        'auth_start' => 'manage_options',
        'auth_check' => 'manage_options',
        'logout'     => 'manage_options',
    );

    public function __construct() {
    }

    public function run() {
        add_action('wp_ajax_lordicon_request', array($this, 'handle_request'));
    }

    public function handle_request() {
        // Verified once, here. Every endpoint used to repeat this check on its own, which
        // added nothing: the same nonce, read from the same request.
        check_ajax_referer('lordicon_action', 'nonce');

        // Check if valid POST request
        if ( ! isset( $_POST['endpoint'] ) ) {
            wp_send_json_error('Invalid request.');
            return;
        }

        // Sanitize endpoint
        $endpoint = sanitize_text_field( wp_unslash( $_POST['endpoint'] ) );

        if ( ! isset( self::CAPABILITIES[ $endpoint ] ) ) {
            wp_send_json_error('Unknown action');
            return;
        }

        /**
         * Filters the capability required for a Lordicon endpoint.
         *
         * @param string $capability Capability name.
         * @param string $endpoint   Endpoint being called.
         */
        $capability = apply_filters('lordicon_required_capability', self::CAPABILITIES[ $endpoint ], $endpoint);

        if ( ! current_user_can( $capability ) ) {
            wp_send_json_error('Insufficient permissions', 403);
            return;
        }

        // Every request field is read and sanitised here, in the same scope as the nonce
        // check above. The endpoints below receive plain values and never touch $_POST -
        // which keeps input handling in one place, and lets a static analyser see that the
        // request was verified before it was read.
        $input = array(
            'email'    => sanitize_email( wp_unslash( $_POST['email'] ?? '' ) ),
            'code'     => sanitize_text_field( wp_unslash( $_POST['code'] ?? '' ) ),
            'family'   => sanitize_text_field( wp_unslash( $_POST['family'] ?? '' ) ),
            'style'    => sanitize_text_field( wp_unslash( $_POST['style'] ?? '' ) ),
            'index'    => sanitize_text_field( wp_unslash( $_POST['index'] ?? '' ) ),
            'name'     => sanitize_text_field( wp_unslash( $_POST['name'] ?? '' ) ),
            'hash'     => sanitize_text_field( wp_unslash( $_POST['hash'] ?? '' ) ),
            'search'   => sanitize_text_field( wp_unslash( $_POST['search'] ?? '' ) ),
            'page'     => isset( $_POST['page'] ) ? intval( wp_unslash( $_POST['page'] ) ) : 1,
            'per_page' => isset( $_POST['per_page'] ) ? intval( wp_unslash( $_POST['per_page'] ) ) : 100,
            'post_id'  => isset( $_POST['post_id'] ) ? intval( wp_unslash( $_POST['post_id'] ) ) : 0,
        );

        switch ($endpoint) {
            case 'auth_start':
                $this->auth_start($input);
                break;
            case 'auth_check':
                $this->auth_check($input);
                break;
            case 'logout':
                $this->logout();
                break;
            case 'status':
                $this->status();
                break;
            case 'variants':
                $this->variants();
                break;
            case 'icons':
                $this->icons($input);
                break;
            case 'track':
                $this->track($input);
                break;
            case 'upload':
                $this->upload($input);
                break;
        }
    }

    private function icons($input) {
        $result = API::get_instance()->icons([
            'family'   => $input['family'],
            'style'    => $input['style'],
            'search'   => $input['search'],
            'index'    => $input['index'],
            'page'     => $input['page'],
            'per_page' => $input['per_page'],
        ]);

        if ( isset( $result['error'] ) ) {
            wp_send_json_error( $result['error'] );
        }

        wp_send_json_success([
            'icons'  => $result['data'] ?? [],
            'params' => [
                'link' => $result['headers']['link'] ?? '',
            ],
        ]);
    }

    private function track($input) {
        $params = [
            'family' => $input['family'],
            'style'  => $input['style'],
            'index'  => intval( $input['index'] ),
        ];

        $result = API::get_instance()->track( $params );

        if ( isset( $result['error'] ) ) {
            wp_send_json_error( $result['error'] );
        }

        wp_send_json_success();
    }

    private function status() {
        $result = API::get_instance()->status();

        if (isset($result['error'])) {
            wp_send_json_error($result['error']);
        } else {
            wp_send_json_success($result['data']);
        }
    }

    private function variants() {
        // Shares both the key and the wrapping format with patch_module(), which reads the
        // same response while rendering the page. Two shapes on one key would mean each side
        // treating the other's entry as a miss.
        $variants = API::cached(Constants::VARIANTS_TRANSIENT, HOUR_IN_SECONDS, function () {
            $result = API::get_instance()->variants();
            return isset($result['error']) ? null : ($result['data'] ?? []);
        });

        if ($variants === null) {
            wp_send_json_error('Unable to load variants');
        }

        wp_send_json_success($variants);
    }

    private function auth_start($input) {
        $email = $input['email'];

        if ( empty( $email ) ) {
            wp_send_json_error( 'Email is required' );
            return;
        }

        $result = API::get_instance()->auth_start( $email );

        if ( isset( $result['error'] ) ) {
            wp_send_json_error( $result['error'] );
        }

        wp_send_json_success( $result['data'] ?? [] );
    }

    private function auth_check($input) {
        $email = $input['email'];
        $code  = $input['code'];

        if ( empty( $email ) || empty( $code ) ) {
            wp_send_json_error( 'Email and code are required' );
            return;
        }

        $result = API::get_instance()->auth_check( $email, $code );

        if ( isset( $result['error'] ) ) {
            wp_send_json_error( $result['error'] );
        }

        $data = $result['data'] ?? [];

        if ( isset( $data['token'] ) ) {
            $settings_json = get_option( 'lordicon_settings', '{}' );
            $settings = json_decode( $settings_json );

            if ( ! is_object( $settings ) ) {
                $settings = new \stdClass();
            }

            $settings->token = $data['token'];
            update_option( 'lordicon_settings', wp_json_encode( $settings ) );

            // The cached status and variants belong to the previous token - a guest one, at
            // this point - so they describe the wrong account until they are dropped.
            API::flush_cache();
        }

        wp_send_json_success();
    }

    private function logout() {
        delete_option('lordicon_settings');
        API::flush_cache();

        wp_send_json_success();
    }

    private function upload($input) {
        // Beyond `edit_posts`: this endpoint writes to the media library.
        if (!current_user_can('upload_files')) {
            wp_send_json_error('Insufficient permissions', 403);
        }

        $post_id = $input['post_id'];
        $family  = $input['family'];
        $style   = $input['style'];
        $index   = $input['index'];
        $name    = $input['name'];
        $hash    = $input['hash'];

        // Ensure required fields are provided before proceeding
        if (empty($family) || empty($style) || empty($index) || empty($name)) {
            wp_send_json_error('Family, style, index, and name are required');
        }

        // Include WordPress media functions
        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/media.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';
 
        $result = [
            'svgAttachmentId'  => 0,
            'jsonAttachmentId' => 0,
        ];

        // Check existing attachments
        $existing_svg  = $this->find_existing_attachment('svg', $family, $style, $index, $name, $post_id, $hash);
        $existing_json = $this->find_existing_attachment('json', $family, $style, $index, $name, $post_id);

        if ($existing_svg)  $result['svgAttachmentId']  = $existing_svg;
        if ($existing_json) $result['jsonAttachmentId'] = $existing_json;

        // The uploaded files themselves cannot be read in the dispatcher the way the rest of
        // the request is: media_handle_upload() reads $_FILES by key on its own, so the
        // handling has to stay here. The request was verified by check_ajax_referer() in
        // handle_request(), which PHPCS cannot see across a method boundary.
        //
        // phpcs:disable WordPress.Security.NonceVerification.Missing
        foreach ([
            'svg_file' => ['type' => 'svg', 'mime' => 'image/svg+xml'],
            'json_file' => ['type' => 'json', 'mime' => 'application/json']
        ] as $input_name => $props) {
            // Proceed only if a file is uploaded and there is no existing attachment
            if (isset($_FILES[$input_name], $_FILES[$input_name]['tmp_name']) && $result[$props['type'].'AttachmentId'] <= 0) {
                // Sanitize file name
                $filename = isset($_FILES[$input_name]['name']) ? sanitize_file_name(wp_unslash($_FILES[$input_name]['name'])) : '';
                $_FILES[$input_name]['name'] = $filename;

                $tmp_name = isset($_FILES[$input_name]['tmp_name']) ? wp_normalize_path(sanitize_text_field($_FILES[$input_name]['tmp_name'])) : '';

                if (
                    $tmp_name &&
                    isset($_FILES[$input_name]['error']) &&
                    $_FILES[$input_name]['error'] === UPLOAD_ERR_OK &&
                    is_uploaded_file($tmp_name)
                ) {
                    // Verify file type and extension to match expected type
                    $filetype = wp_check_filetype_and_ext($tmp_name, $filename);

                    if ($filetype['ext'] !== $props['type'] || $filetype['type'] !== $props['mime']) {
                        wp_send_json_error('Invalid ' . strtoupper($props['type']) . ' file type.');
                    }

                    // Use WordPress media handling to store the uploaded file properly
                    $attachment_id = media_handle_upload($input_name, $post_id);
                    if (is_wp_error($attachment_id)) {
                        wp_send_json_error($attachment_id->get_error_message());
                    }

                    // Update post title for easier identification in Media Library
                    $title = sprintf('%s-%s-%s-%s', $family, $style, $index, $name);
                    wp_update_post(['ID' => $attachment_id, 'post_title' => $title]);

                    // Store custom meta for later identification of uploaded icons
                    foreach ([
                        '_lordicon_type'   => $props['type'],
                        '_lordicon_family' => $family,
                        '_lordicon_style'  => $style,
                        '_lordicon_index'  => $index,
                        '_lordicon_name'   => $name,
                        '_lordicon_hash'   => $hash,
                    ] as $meta_key => $meta_value) {
                        update_post_meta($attachment_id, $meta_key, $meta_value);
                    }

                    // Store attachment ID in result for response
                    $result[$props['type'].'AttachmentId'] = $attachment_id;
                }
            }
        }
        // phpcs:enable WordPress.Security.NonceVerification.Missing

        wp_send_json_success($result);
    }

    /**
     * Finds an attachment this plugin uploaded earlier for the same icon.
     *
     * Each Lordicon file is stored with meta describing its type, family, style, index, name
     * and - for rendered SVGs - a hash of the visual properties, so a repeated insert reuses
     * the existing file instead of filling the media library with duplicates.
     *
     * @return int|null Attachment ID, or null when there is no match.
     */
    private function find_existing_attachment($type, $family, $style, $index, $name, $post_id = 0, $hash = null) {
        $meta_query = array(
            array(
                'key' => '_lordicon_type',
                'value' => $type
            ),
            array(
                'key' => '_lordicon_family',
                'value' => $family
            ),
            array(
                'key' => '_lordicon_style',
                'value' => $style
            ),
            array(
                'key' => '_lordicon_index',
                'value' => $index
            ),
            array(
                'key' => '_lordicon_name',
                'value' => $name
            )
        );

        if (!empty($hash)) {
            $meta_query[] = array(
                'key' => '_lordicon_hash',
                'value' => $hash
            );
        }

        $args = array(
            'post_type' => 'attachment',
            'post_status' => 'inherit',
            'post_parent' => $post_id,
            'meta_query' => $meta_query,
            // Only the first match is ever read, and only its ID. Bounding the query and
            // skipping the row count keeps an unbounded meta lookup off the page load.
            'posts_per_page' => 1,
            'no_found_rows' => true,
            'update_post_term_cache' => false,
            'fields' => 'ids',
        );

        $attachments = get_posts($args);
        return !empty($attachments) ? $attachments[0] : null;
    }
}
