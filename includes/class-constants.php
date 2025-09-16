<?php
namespace Lordicon;

if (!defined('ABSPATH')) {
	exit;
}

class Constants {
    const PLUGIN_VERSION = '1.0.0';
	const PLUGIN_NAME = 'lordicon';
	const PLUGIN_BASENAME = 'lordicon/lordicon.php';
    const APP_NAME = 'wp';

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
}