<?php
/**
 * Admin Interface for ProductDescriptions.io
 */

if (!defined('ABSPATH')) {
    exit;
}

class PDIO_Admin {
    
    private static $instance = null;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        $this->init_hooks();
    }
    
    private function init_hooks() {
        // Add menu items
        add_action('admin_menu', array($this, 'add_menu_items'));
        
        // Add metabox to product edit page
        add_action('add_meta_boxes', array($this, 'add_product_metabox'));
        
        // Add bulk action
        add_filter('bulk_actions-edit-product', array($this, 'add_bulk_actions'));
        add_filter('handle_bulk_actions-edit-product', array($this, 'handle_bulk_actions'), 10, 3);
        
        // AJAX handlers
        add_action('wp_ajax_pdio_generate_single', array($this, 'ajax_generate_single'));
        add_action('wp_ajax_pdio_analyze_image', array($this, 'ajax_analyze_image'));
    }
    
    /**
     * Add menu items
     */
    public function add_menu_items() {
        add_menu_page(
            __('ProductDescriptions.io', 'productdescriptions-io'),
            __('AI Descriptions', 'productdescriptions-io'),
            'manage_woocommerce',
            'productdescriptions-io',
            array($this, 'render_dashboard'),
            'dashicons-edit-large',
            56
        );
        
        add_submenu_page(
            'productdescriptions-io',
            __('Dashboard', 'productdescriptions-io'),
            __('Dashboard', 'productdescriptions-io'),
            'manage_woocommerce',
            'productdescriptions-io',
            array($this, 'render_dashboard')
        );
        
        add_submenu_page(
            'productdescriptions-io',
            __('Bulk Generate', 'productdescriptions-io'),
            __('Bulk Generate', 'productdescriptions-io'),
            'manage_woocommerce',
            'productdescriptions-io-bulk',
            array(PDIO_Bulk::get_instance(), 'render_page')
        );
        
        add_submenu_page(
            'productdescriptions-io',
            __('Settings', 'productdescriptions-io'),
            __('Settings', 'productdescriptions-io'),
            'manage_woocommerce',
            'productdescriptions-io-settings',
            array(PDIO_Settings::get_instance(), 'render_page')
        );
    }
    
    /**
     * Render dashboard page
     */
    public function render_dashboard() {
        $api = PDIO_API::get_instance();
        $usage = $api->get_usage();
        $stats = get_option('pdio_usage_stats', array());
        ?>
        <div class="wrap">
            <h1><?php _e('ProductDescriptions.io Dashboard', 'productdescriptions-io'); ?></h1>
            
            <?php if (!get_option('pdio_api_key')): ?>
                <div class="notice notice-warning">
                    <p><?php _e('Please configure your API key in the settings to start generating descriptions.', 'productdescriptions-io'); ?></p>
                    <p><a href="<?php echo admin_url('admin.php?page=productdescriptions-io-settings'); ?>" class="button button-primary"><?php _e('Go to Settings', 'productdescriptions-io'); ?></a></p>
                </div>
            <?php else: ?>
                
                <div class="pdio-stats-grid">
                    <div class="pdio-stat-card">
                        <h3><?php _e('This Month', 'productdescriptions-io'); ?></h3>
                        <div class="pdio-stat-number"><?php echo intval($stats['descriptions_generated'] ?? 0); ?></div>
                        <div class="pdio-stat-label"><?php _e('Descriptions Generated', 'productdescriptions-io'); ?></div>
                    </div>
                    
                    <div class="pdio-stat-card">
                        <h3><?php _e('Images', 'productdescriptions-io'); ?></h3>
                        <div class="pdio-stat-number"><?php echo intval($stats['images_generated'] ?? 0); ?></div>
                        <div class="pdio-stat-label"><?php _e('AI Images Created', 'productdescriptions-io'); ?></div>
                    </div>
                    
                    <?php if (!is_wp_error($usage)): ?>
                        <div class="pdio-stat-card">
                            <h3><?php _e('API Usage', 'productdescriptions-io'); ?></h3>
                            <div class="pdio-stat-number"><?php echo $usage['used'] ?? 0; ?> / <?php echo $usage['limit'] ?? '∞'; ?></div>
                            <div class="pdio-stat-label"><?php _e('Monthly Limit', 'productdescriptions-io'); ?></div>
                        </div>
                    <?php endif; ?>
                </div>
                
                <div class="pdio-quick-actions">
                    <h2><?php _e('Quick Actions', 'productdescriptions-io'); ?></h2>
                    <a href="<?php echo admin_url('admin.php?page=productdescriptions-io-bulk'); ?>" class="button button-primary button-hero">
                        <?php _e('Bulk Generate Descriptions', 'productdescriptions-io'); ?>
                    </a>
                    <a href="<?php echo admin_url('edit.php?post_type=product'); ?>" class="button button-secondary button-hero">
                        <?php _e('View Products', 'productdescriptions-io'); ?>
                    </a>
                </div>
                
            <?php endif; ?>
        </div>
        <?php
    }
    
    /**
     * Add metabox to product edit page
     */
    public function add_product_metabox() {
        add_meta_box(
            'pdio_generator',
            __('AI Description Generator', 'productdescriptions-io'),
            array($this, 'render_product_metabox'),
            'product',
            'side',
            'high'
        );
    }
    
    /**
     * Render product metabox
     */
    public function render_product_metabox($post) {
        $product = wc_get_product($post->ID);
        ?>
        <div class="pdio-metabox">
            <?php if (!get_option('pdio_api_key')): ?>
                <p><?php _e('Please configure API key in settings.', 'productdescriptions-io'); ?></p>
            <?php else: ?>
                <div class="pdio-generate-options">
                    <label>
                        <strong><?php _e('Tone:', 'productdescriptions-io'); ?></strong>
                        <select id="pdio_tone" style="width: 100%;">
                            <option value="professional"><?php _e('Professional', 'productdescriptions-io'); ?></option>
                            <option value="casual"><?php _e('Casual', 'productdescriptions-io'); ?></option>
                            <option value="luxury"><?php _e('Luxury', 'productdescriptions-io'); ?></option>
                            <option value="playful"><?php _e('Playful', 'productdescriptions-io'); ?></option>
                            <option value="technical"><?php _e('Technical', 'productdescriptions-io'); ?></option>
                        </select>
                    </label>
                    
                    <label style="margin-top: 10px; display: block;">
                        <input type="checkbox" id="pdio_generate_images" checked>
                        <?php _e('Generate AI Images', 'productdescriptions-io'); ?>
                    </label>
                    
                    <?php if ($product->get_image_id()): ?>
                        <label style="margin-top: 10px; display: block;">
                            <input type="checkbox" id="pdio_analyze_image">
                            <?php _e('Analyze Product Image', 'productdescriptions-io'); ?>
                        </label>
                    <?php endif; ?>
                </div>
                
                <button type="button" class="button button-primary button-large" id="pdio_generate_btn" data-product-id="<?php echo $post->ID; ?>" style="width: 100%; margin-top: 15px;">
                    <?php _e('Generate AI Description', 'productdescriptions-io'); ?>
                </button>
                
                <div id="pdio_result" style="margin-top: 15px; display: none;"></div>
            <?php endif; ?>
        </div>
        <?php
    }
    
    /**
     * Add bulk actions
     */
    public function add_bulk_actions($actions) {
        $actions['pdio_generate'] = __('Generate AI Descriptions', 'productdescriptions-io');
        return $actions;
    }
    
    /**
     * Handle bulk actions
     */
    public function handle_bulk_actions($redirect_to, $action, $post_ids) {
        if ($action !== 'pdio_generate') {
            return $redirect_to;
        }
        
        // Store product IDs for bulk generation
        set_transient('pdio_bulk_products', $post_ids, 3600);
        
        // Redirect to bulk generation page
        return admin_url('admin.php?page=productdescriptions-io-bulk&ids=' . implode(',', $post_ids));
    }
    
    /**
     * AJAX handler for single product generation
     */
    public function ajax_generate_single() {
        check_ajax_referer('pdio_ajax_nonce', 'nonce');
        
        if (!current_user_can('edit_products')) {
            wp_die(__('Unauthorized', 'productdescriptions-io'));
        }
        
        $product_id = intval($_POST['product_id']);
        $tone = sanitize_text_field($_POST['tone'] ?? 'professional');
        $generate_images = $_POST['generate_images'] === 'true';
        $analyze_image = $_POST['analyze_image'] === 'true';
        
        $generator = PDIO_Generator::get_instance();
        $result = $generator->generate_for_product($product_id, array(
            'tone' => $tone,
            'generate_images' => $generate_images,
            'analyze_image' => $analyze_image
        ));
        
        if (is_wp_error($result)) {
            wp_send_json_error($result->get_error_message());
        }
        
        wp_send_json_success($result);
    }
    
    /**
     * AJAX handler for image analysis
     */
    public function ajax_analyze_image() {
        check_ajax_referer('pdio_ajax_nonce', 'nonce');
        
        if (!current_user_can('edit_products')) {
            wp_die(__('Unauthorized', 'productdescriptions-io'));
        }
        
        $product_id = intval($_POST['product_id']);
        $product = wc_get_product($product_id);
        
        if (!$product || !$product->get_image_id()) {
            wp_send_json_error(__('No product image found', 'productdescriptions-io'));
        }
        
        $image_url = wp_get_attachment_url($product->get_image_id());
        $api = PDIO_API::get_instance();
        $result = $api->analyze_image($image_url);
        
        if (is_wp_error($result)) {
            wp_send_json_error($result->get_error_message());
        }
        
        wp_send_json_success($result);
    }
}