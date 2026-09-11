<?php
namespace Lordicon;

if (!defined('ABSPATH')) {
	exit;
}

class Constants {
    // Must match the `Version` header in lordicon.php and `Stable tag` in readme.txt.
    const PLUGIN_VERSION = '1.1.0';
	const PLUGIN_NAME = 'lordicon';
	const PLUGIN_BASENAME = 'lordicon/lordicon.php';
    const APP_NAME = 'wp';

    // Cached API responses. Both are dropped by API::flush_cache() when the token changes.
    const STATUS_TRANSIENT = 'lordicon_status';
    const VARIANTS_TRANSIENT = 'lordicon_variants';

	public static function plugin_version() {
		return self::PLUGIN_VERSION;
    }

	public static function plugin_name() {
		return self::PLUGIN_NAME;
	}

	public static function plugin_basename() {
		return self::PLUGIN_BASENAME;
	}

    public static function app_name() {
        return self::APP_NAME;
    }

    public static function status_transient() {
        return self::STATUS_TRANSIENT;
    }

    public static function variants_transient() {
        return self::VARIANTS_TRANSIENT;
    }
}