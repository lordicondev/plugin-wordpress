<?php
namespace Lordicon;

if (!defined('ABSPATH')) {
    exit;
}

function is_settings() {
    $screen = get_current_screen();
    if (!$screen) {
        return false;
    }

    // Check if this screen is a settings page of our plugin
    // Matches either top-level or submenu pages
    $menu_slug = 'lordicon-settings';
    return str_ends_with($screen->id, $menu_slug);
}

class Plugin {
    private $loader;
    private $handler;

    public function __construct() {
        $this->load_dependencies();
        $this->init();
    }

    public function run() {
        $this->loader->run();
        $this->handler->run();
    }

    private function load_dependencies() {
        require_once plugin_dir_path(dirname(__FILE__)).'includes/class-constants.php';
        require_once plugin_dir_path(dirname(__FILE__)).'includes/class-loader.php';
        require_once plugin_dir_path(dirname(__FILE__)).'includes/class-api.php';
        require_once plugin_dir_path(dirname(__FILE__)).'includes/class-ajax-handler.php';
    }

    private function init() {
        $this->loader = new Loader();
        $this->loader->add_filter('upload_mimes', $this, 'allow_lordicon_mimes');
        $this->loader->add_filter('wp_check_filetype_and_ext', $this, 'check_lordicon_filetype', 10, 4);
        $this->loader->add_filter('post_mime_types', $this, 'add_json_mime_types');
        $this->loader->add_filter('wp_prepare_attachment_for_js', $this, 'prepare_json_attachment_for_js', 10, 3);

        if (is_admin()) {
            $this->loader->add_action('admin_enqueue_scripts', $this, 'enqueue_admin_assets');
            $this->loader->add_action('enqueue_block_editor_assets', $this, 'enqueue_block_editor_assets');
            $this->loader->add_action('admin_menu', $this, 'settings_init_menu');
            $this->loader->add_action('admin_init', $this, 'settings_handle_form_submission');

            $this->loader->add_filter('plugin_row_meta', $this, 'plugin_links', 10, 3);
        } else {
            $define_element = apply_filters('lordicon_define_element', true);

            if ($define_element) {
                $this->loader->add_action('wp_enqueue_scripts', $this, 'enqueue_frontend_assets');
            }
        }

        // Block registration (both admin and frontend)
        $this->loader->add_action('init', $this, 'register_block_type');

        $this->handler = new AjaxHandler();
    }

    public function enqueue_admin_assets() {
        if (is_settings()) {
            wp_enqueue_script(
                'lordicon-settings-script',
                plugins_url('/dist/settings.js', dirname(__FILE__)),
                array(),
                Constants::plugin_version(),
            );

            wp_enqueue_style(
                'lordicon-settings-css',
                plugins_url('/dist/settings.css', dirname(__FILE__)),
                array(),
                Constants::plugin_version()
            );
        
            $this->patch_module('lordicon-settings-script', 'settings');
        }
    }

    public function enqueue_block_editor_assets() {
        wp_enqueue_script(
            'lordicon-block-js',
            plugins_url('/dist/block.js', dirname(__FILE__)),
            array('wp-blocks', 'wp-element', 'wp-components', 'wp-block-editor', 'wp-i18n'),
            Constants::plugin_version(),
        );

        wp_enqueue_style(
            'lordicon-block-css',
            plugins_url('/dist/block.css', dirname(__FILE__)),
            array('wp-edit-blocks'),
            Constants::plugin_version()
        );

        $this->patch_module('lordicon-block-js', 'editor');
    }

    public function enqueue_frontend_assets() {
        wp_enqueue_style(
            'lordicon-element-style',
            plugins_url('/dist/element.css', dirname(__FILE__)),
            array(),
            Constants::plugin_version()
        );

        wp_enqueue_script_module(
            'lordicon-element-script',
            plugins_url('/dist/element.js', dirname(__FILE__)),
            array(),
            Constants::plugin_version(),
        );    
    }

    private function patch_module(string $scriptHandle, string $context) {
        $url     = admin_url('admin-ajax.php');
        $nonce   = wp_create_nonce('lordicon_action');
        $status  = API::get_instance()->status()['data'];
        $variants = $status ? API::get_instance()->variants()['data'] : [];

        // Safely get post ID without using $_GET
        $post_id = 0;
        if ($context === 'editor') {
            $post = get_post();
            if ($post && $post->ID) {
                $post_id = $post->ID;
            }
        }

        $config = [
            'url'      => $url,
            'nonce'    => $nonce,
            'status'   => $status,
            'variants' => $variants,
            'postId'   => $post_id,
            'context'  => $context,
        ];

        wp_add_inline_script(
            $scriptHandle,
            'window.__LORDICON__ = ' . wp_json_encode($config) . ';',
            'after'
        );

        // Patch the script tag to use type="module"
        add_filter('script_loader_tag', function ($tag, $handle, $src) use ($scriptHandle) {
            if ($scriptHandle !== $handle) return $tag;

            $search = sprintf('id="%s-js"', $scriptHandle);
            $replace = $search . ' type="module"';
            return str_replace($search, $replace, $tag);
        }, 10, 3);
    }

    public function register_block_type() {
        register_block_type(dirname(__DIR__) . '/dist/block.json', array(
            'render_callback' => array($this, 'render_block'),
        ));
    }

    public function settings_init_menu() {
        add_options_page(
            'Lordicon Settings',
            'Lordicon',
            'manage_options',
            'lordicon-settings',
            array($this, 'render_settings'),
        );
    }

    public function settings_handle_form_submission() {
        // Check if form is submitted
        if ( ! isset( $_POST['lordicon_settings'], $_POST['lordicon_nonce'] ) ) {
            return;
        }

        // Sanitize nonce
        $nonce = sanitize_text_field( wp_unslash( $_POST['lordicon_nonce'] ) );
        if ( ! wp_verify_nonce( $nonce, 'lordicon_settings_action' ) ) {
            return;
        }

        // Sanitize settings
        $settings = array_map( 'sanitize_text_field', (array) wp_unslash( $_POST['lordicon_settings'] ) );

        // Save settings
        update_option( 'lordicon_settings', $settings );

        // Message
        add_settings_error(
            'lordicon_settings',
            'settings_updated',
            'Settings saved.',
            'updated'
        );
    }

    public function plugin_links($plugin_links, $plugin_file, $plugin_data) {
        $links = array();
        if (isset($plugin_data['AuthorName']) && $plugin_data['AuthorName'] == 'Lordicon') {
            $links = array(
                '<a href="' . admin_url('options-general.php?page=lordicon-settings') . '">Settings</a>',
            );
        }
        return array_merge($plugin_links, $links);
    }

    public function allow_lordicon_mimes($mimes) {
        if (!isset($mimes['json'])) {
            $mimes['json'] = 'application/json';
        }
        if (!isset($mimes['svg'])) {
            $mimes['svg'] = 'image/svg+xml';
        }
        return $mimes;
    }

    public function add_json_mime_types($mime_types) {
        $mime_types['application/json'] = array(
            __('Lordicon Files', 'lordicon'),
            __('Manage Lordicon Files', 'lordicon'),
            // translators: %s is the number of Lordicon files
            _n_noop('Lordicon File <span class="count">(%s)</span>', 'Lordicon Files <span class="count">(%s)</span>', 'lordicon'),
        );
        
        return $mime_types;
    }

    public function prepare_json_attachment_for_js($response, $attachment, $meta) {
        if ($response['mime'] === 'application/json') {
            $response['icon'] = plugins_url('assets/lordicon-icon.png', dirname(__FILE__));
            
            if (get_post_meta($attachment->ID, '_lordicon_type', true) === 'json') {
                $response['subtype'] = 'lordicon-json';
                $response['title'] = $response['title'];
            }
        }
        
        return $response;
    }
    
    public function check_lordicon_filetype($data, $file, $filename, $mimes) {
        if (substr($filename, -5) === '.json') {
            $data['ext'] = 'json';
            $data['type'] = 'application/json';
        }
        if (substr($filename, -4) === '.svg') {
            $data['ext'] = 'svg';
            $data['type'] = 'image/svg+xml';
        }
        return $data;
    }

    public function render_block( $attributes, $content ) {
        $icon                = $attributes['icon'] ?? null;
        $json_attachment_id  = isset( $attributes['jsonAttachmentId'] ) ? intval( $attributes['jsonAttachmentId'] ) : 0;
        $svg_attachment_id   = isset( $attributes['svgAttachmentId'] ) ? intval( $attributes['svgAttachmentId'] ) : 0;
        $anchor              = $attributes['anchor'] ?? '';
        $class_name          = $attributes['className'] ?? '';
        $display             = $attributes['properties']['display'] ?? 'block';
        $format              = $attributes['properties']['format'] ?? 'json';

        if ( ! $icon ) {
            return '';
        }

        $json_src = $json_attachment_id ? wp_get_attachment_url( $json_attachment_id ) : '';
        $svg_src  = $svg_attachment_id ? wp_get_attachment_url( $svg_attachment_id ) : '';

        // Classes
        $css_classes = [ 'lordicon-wrapper' ];
        if ( 'block' !== $display ) {
            $css_classes[] = 'lordicon-wrapper-' . sanitize_html_class( $display );
        }
        if ( ! empty( $class_name ) ) {
            $css_classes[] = sanitize_html_class( $class_name );
        }
        $class_attr = esc_attr( implode( ' ', $css_classes ) );

        // ID (anchor)
        $id_attr = '';
        if ( ! empty( $anchor ) ) {
            $id_attr = ' id="' . esc_attr( $anchor ) . '"';
        }

        // Prepare <lord-icon> attributes as key => value (value true means boolean attr)
        $lord_icon_attrs = [];

        if ( $json_src ) {
            $lord_icon_attrs['src'] = esc_url( $json_src );

            // trigger
            $allowed_triggers = [ 'in', 'hover', 'click', 'loop', 'morph' ];
            $trigger = 'hover';
            if ( ! empty( $attributes['properties']['state'] ) ) {
                $state_parts       = explode( '-', $attributes['properties']['state'] );
                $potential_trigger = $state_parts[0] ?? '';
                if ( in_array( $potential_trigger, $allowed_triggers, true ) ) {
                    $trigger = $potential_trigger;
                }
            }
            $lord_icon_attrs['trigger'] = $trigger;

            // size -> style attribute
            if ( ! empty( $attributes['properties']['size'] ) && intval( $attributes['properties']['size'] ) > 0 ) {
                $size_val                 = intval( $attributes['properties']['size'] );
                $lord_icon_attrs['style'] = "width:{$size_val}px;height:{$size_val}px;";
            }

            // stroke
            if ( isset( $attributes['properties']['stroke'] ) && $attributes['properties']['stroke'] !== 2 ) {
                $lord_icon_attrs['stroke'] = (string) $attributes['properties']['stroke'];
            }

            // colors (name:value,name:value)
            if ( ! empty( $attributes['properties']['colors'] ) && is_array( $attributes['properties']['colors'] ) ) {
                $color_pairs = [];
                foreach ( $attributes['properties']['colors'] as $name => $value ) {
                    $color_pairs[] = sanitize_key( (string) $name ) . ':' . sanitize_text_field( (string) $value );
                }
                $lord_icon_attrs['colors'] = implode( ',', $color_pairs );
            }

            // state
            if ( ! empty( $attributes['properties']['state'] ) ) {
                $lord_icon_attrs['state'] = sanitize_text_field( $attributes['properties']['state'] );
            }

            // speed (float with dot)
            if ( isset( $attributes['properties']['speed'] ) ) {
                $lord_icon_attrs['speed'] = number_format( floatval( $attributes['properties']['speed'] ), 2, '.', '' );
            }

            // target
            if ( ! empty( $attributes['properties']['target'] ) ) {
                $lord_icon_attrs['target'] = sanitize_text_field( $attributes['properties']['target'] );
            }

            // sequence (forces trigger=sequence)
            if ( ! empty( $attributes['properties']['sequence'] ) ) {
                $lord_icon_attrs['sequence'] = sanitize_text_field( $attributes['properties']['sequence'] );
                $lord_icon_attrs['trigger']  = 'sequence';
            }

            // intro (boolean attribute)
            $has_intro = ! empty( $attributes['properties']['intro'] ) && true === $attributes['properties']['intro'];

            // loading policy
            $lord_icon_attrs['loading'] = ( ! empty( $svg_src ) && ! $has_intro ) ? 'interaction' : 'lazy';
        }

        ob_start();
        ?>
        <div class="<?php echo esc_attr( implode( ' ', $css_classes ) ); ?>"<?php echo ! empty( $anchor ) ? ' id="' . esc_attr( $anchor ) . '"' : ''; ?>>
            <?php if ( $json_src ) : ?>
                <lord-icon
                    <?php foreach ( $lord_icon_attrs as $attr => $value ) : ?>
                        <?php
                        if ( is_bool( $value ) && $value ) {
                            echo ' ' . esc_attr( $attr );
                        } else {
                            echo ' ' . esc_attr( $attr ) . '="' . esc_attr( (string) $value ) . '"';
                        }
                        ?>
                    <?php endforeach; ?>
                    <?php if ( $has_intro ) : ?>
                        <?php echo ' ' . esc_attr( 'intro' ); ?>
                    <?php endif; ?>
                >
                    <?php if ( $svg_src && ! $has_intro ) : ?>
                        <img src="<?php echo esc_url( $svg_src ); ?>" alt="" loading="lazy" />
                    <?php endif; ?>
                </lord-icon>
            <?php elseif ( 'svg' === $format && $svg_src ) : ?>
                <img src="<?php echo esc_url( $svg_src ); ?>"
                    <?php if ( ! empty( $attributes['properties']['size'] ) && intval( $attributes['properties']['size'] ) > 0 ) : ?>
                        style="width:<?php echo intval( $attributes['properties']['size'] ); ?>px;height:<?php echo intval( $attributes['properties']['size'] ); ?>px;"
                    <?php endif; ?>
                />
            <?php else : ?>
                <div class="lordicon-info">
                    <p>
                        <?php
                        $label = sprintf(
                            '%s-%s-%s-%s',
                            $icon['family'] ?? '',
                            $icon['style'] ?? '',
                            $icon['index'] ?? '',
                            $icon['name'] ?? ''
                        );
                        echo esc_html( sprintf( 'Icon unavailable: %s. Edit this block and choose a new icon.', $label ) );
                        ?>
                    </p>
                </div>
            <?php endif; ?>
        </div>
        <?php
        return ob_get_clean();
    }

    public function render_settings() {
        ?>
        <div id="lordicon"></div>
        <?php
    }
}