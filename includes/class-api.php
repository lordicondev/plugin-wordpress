<?php
namespace Lordicon;

if (!defined('ABSPATH')) {
    exit;
}

class API {
    private static $instance = null;

    private $api_base_url = 'https://api.lordicon.com/v1/';
    private $settings;

    public function __construct() {
        $settings = json_decode(get_option('lordicon_settings', '{}'));

        // A malformed or non-JSON option decodes to null, and assigning a property on null is
        // a fatal in PHP 8 - autologin() does exactly that. The AJAX handler already guards
        // its own decode of this option the same way.
        $this->settings = is_object($settings) ? $settings : new \stdClass();
    }

    public static function get_instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Reads an API response through a transient, calling $fetch only on a miss.
     *
     * The value is wrapped, because a transient holding null or an empty array cannot be told
     * apart from a missing one - get_transient() returns false for both. A failed fetch is
     * cached too, but only briefly, so an unreachable API does not make every admin page load
     * wait out the request timeout while still recovering on its own.
     *
     * @param string   $key   Transient key.
     * @param int      $ttl   Lifetime of a successful response, in seconds.
     * @param callable $fetch Called on a miss; returns the value to cache.
     */
    public static function cached(string $key, int $ttl, callable $fetch) {
        $cached = get_transient($key);

        // Matched on the exact shape, not just the presence of the key: a transient written
        // by an earlier version of the plugin holds the bare response, and must read as a
        // miss rather than as a wrapper that happens to have a 'data' entry.
        if (is_array($cached) && array_keys($cached) === array('data')) {
            return $cached['data'];
        }

        $value = $fetch();

        // Null is how both callers report a failed request; an empty array is a perfectly
        // good answer and keeps the full lifetime. Testing truthiness instead would put every
        // empty response on the one-minute retry.
        set_transient($key, array('data' => $value), $value === null ? MINUTE_IN_SECONDS : $ttl);

        return $value;
    }

    /**
     * Drops every cached API response.
     *
     * Called whenever the token changes - signing in or out makes both the account status and
     * the icon variants available to it stale.
     */
    public static function flush_cache() {
        delete_transient(Constants::STATUS_TRANSIENT);
        delete_transient(Constants::VARIANTS_TRANSIENT);
    }

    /**
     * Ensures a usable API token.
     *
     * Falls back to a guest token, which is what gives a signed-out site access to the free
     * icon set.
     *
     * @return array Either a token or an error.
     */
    public function autologin() {
        if (!empty($this->settings->token)) {
            return array('token' => $this->settings->token);
        }

        $response = $this->auth_guest();

        if (!empty($response['data']['token'])) {
            $this->settings->token = $response['data']['token'];
            update_option('lordicon_settings', wp_json_encode($this->settings));
            return array('token' => $this->settings->token);
        }

        return array('error' => $response['error'] ?? 'Autologin failed');
    }

    public function auth_guest() {
        $url = $this->api_base_url . 'auth/' . Constants::app_name();
        
        $args = array(
            'headers' => array('Content-Type' => 'application/json'),
            'body' => null,
            'method' => 'POST',
            'timeout' => 15,
        );

        $response = wp_remote_request($url, $args);

        return $this->handle_response($response);
    }

    public function auth_start($email) {
        $url = $this->api_base_url . 'auth/' . Constants::app_name();
        
        $args = array(
            'headers' => array('Content-Type' => 'application/json'),
            'body' => wp_json_encode(array('email' => $email)),
            'method' => 'POST',
            'timeout' => 15,
        );

        $response = wp_remote_request($url, $args);

        return $this->handle_response($response);
    }

    public function auth_check($email, $code) {
        $url = $this->api_base_url . 'auth/' . Constants::app_name();

        $args = array(
            'headers' => array('Content-Type' => 'application/json'),
            'body' => wp_json_encode(array('email' => $email, 'code' => $code)),
            'method' => 'PATCH',
            'timeout' => 15,
        );

        $response = wp_remote_request($url, $args);

        return $this->handle_response($response);
    }

    public function status() {
        $this->autologin();
        
        $url = $this->api_base_url . 'status';
        $token = $this->token;

        if (!$token) {
            return array('error' => 'Unauthorized');
        }

        $args = array(
            'headers' => array(
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer ' . ($token),
            ),
            'method' => 'GET',
            'timeout' => 5,
        );

        $response = wp_remote_request($url, $args);

        return $this->handle_response($response);
    }

    public function variants() {
        $this->autologin();

        $url = $this->api_base_url . 'variants';
        $token = $this->token;

        if (!$token) {
            return array('error' => 'Unauthorized');
        }

        $args = array(
            'headers' => array(
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer ' . ($token),
            ),
            'method' => 'GET',
            'timeout' => 5,
        );

        $response = wp_remote_request($url, $args);

        return $this->handle_response($response);
    }

    public function icons($params) {
        $this->autologin();

        $url = $this->api_base_url . 'icons';
        if (!empty($params)) {
            $query_string = http_build_query($params);
            $url .= '?' . $query_string;
        }

        $token = $this->token;

        if (!$token) {
            return array('error' => 'Unauthorized');
        }

        $args = array(
            'headers' => array(
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer ' . ($token),
            ),
            'method' => 'GET',
            'timeout' => 5,
        );

        $response = wp_remote_request($url, $args);

        return $this->handle_response($response);
    }

    public function track($params) {
        $this->autologin();

        $url = $this->api_base_url . 'download/track';
      
        $token = $this->token;

        if (!$token) {
            return array('error' => 'Unauthorized');
        }

        $args = array(
            'headers' => array(
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer ' . ($token),
            ),
            'body' => wp_json_encode($params),
            'method' => 'POST',
            'timeout' => 15,
        );

        $response = wp_remote_request($url, $args);

        return $this->handle_response($response);
    }

    private function handle_response($response) {
        if (is_wp_error($response)) {
            return array('error' => $response->get_error_message());
        }

        $body_raw = wp_remote_retrieve_body($response);
        $headers = wp_remote_retrieve_headers($response)->getAll();
        $status_code = wp_remote_retrieve_response_code($response);
        $body = json_decode($body_raw, true);
        
        if (isset($body['error']) || isset($body['message'])) {
            return array('error' => $body['message'] ?? $body['error']);
        }
    
        return array(
            'data' => $body,
            'headers' => $headers,
            'status_code' => $status_code,
        );
    }

    private function __clone() {}

    public function __wakeup() {
        throw new \Exception("Cannot unserialize singleton");
    }

    public function __get($property) {
        if ($property === 'token') {
            return $this->settings->token ?? null;
        }
        return null;
    }
}