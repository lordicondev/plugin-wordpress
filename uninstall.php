<?php
/**
 * Runs when the plugin is deleted from the Plugins screen.
 *
 * Removes everything the plugin stored about itself. Deliberately *not* removed: the icon
 * files in the media library and the per-attachment meta describing them. Those are the
 * user's content — posts still reference them, and deleting the plugin should not empty
 * pages that were built with it.
 *
 * @package Lordicon
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

/**
 * Removes the plugin's stored data for the current site.
 */
function lordicon_uninstall_site() {
	delete_option( 'lordicon_settings' );

	// Literals rather than Constants::*, because uninstall.php runs without loading the
	// plugin. Keep in step with the transient keys in includes/class-constants.php.
	delete_transient( 'lordicon_status' );
	delete_transient( 'lordicon_variants' );
}

/**
 * Removes it everywhere, one site at a time on a network install.
 */
function lordicon_uninstall() {
	if ( ! is_multisite() ) {
		lordicon_uninstall_site();
		return;
	}

	$sites = get_sites(
		array(
			'fields'                 => 'ids',
			'number'                 => 0,
			'update_site_meta_cache' => false,
		)
	);

	foreach ( $sites as $site ) {
		switch_to_blog( $site );
		lordicon_uninstall_site();
		restore_current_blog();
	}
}

lordicon_uninstall();
