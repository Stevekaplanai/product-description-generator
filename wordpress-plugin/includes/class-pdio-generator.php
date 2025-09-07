<?php
/**
 * Description Generator for ProductDescriptions.io
 */

if (!defined('ABSPATH')) {
    exit;
}

class PDIO_Generator {
    
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
        // Auto-generate on product creation
        if (get_option('pdio_auto_generate') === 'yes') {
            add_action('woocommerce_new_product', array($this, 'auto_generate_description'), 10, 1);
            add_action('woocommerce_update_product', array($this, 'maybe_auto_generate'), 10, 1);
        }
    }
    
    /**
     * Generate description for a product
     */
    public function generate_for_product($product_id, $options = array()) {
        $product = wc_get_product($product_id);
        if (!$product) {
            return new WP_Error('invalid_product', __('Invalid product ID', 'productdescriptions-io'));
        }
        
        // Prepare product data
        $product_data = $this->prepare_product_data($product, $options);
        
        // Call API
        $api = PDIO_API::get_instance();
        $result = $api->generate_description($product_data);
        
        if (is_wp_error($result)) {
            return $result;
        }
        
        // Update product with generated content
        if (isset($result['descriptions']) && !empty($result['descriptions'])) {
            $description = $result['descriptions'][0];
            
            // Update product description
            $product->set_description($description);
            $product->save();
            
            // Save images if generated
            if (isset($result['images']) && !empty($result['images'])) {
                $this->save_generated_images($product_id, $result['images']);
            }
            
            // Log generation
            $this->log_generation($product_id, $result);
            
            // Update stats
            $this->update_stats($result);
        }
        
        return $result;
    }
    
    /**
     * Prepare product data for API
     */
    private function prepare_product_data($product, $options = array()) {
        // Get product categories
        $categories = wp_get_post_terms($product->get_id(), 'product_cat', array('fields' => 'names'));
        $category = !empty($categories) ? $categories[0] : 'General';
        
        // Get product attributes
        $attributes = $product->get_attributes();
        $features = array();
        
        foreach ($attributes as $attribute) {
            if ($attribute->is_visible()) {
                $values = $attribute->get_options();
                $feature = $attribute->get_name() . ': ' . implode(', ', $values);
                $features[] = $feature;
            }
        }
        
        // Add basic product info as features if no attributes
        if (empty($features)) {
            if ($product->get_sku()) {
                $features[] = 'SKU: ' . $product->get_sku();
            }
            if ($product->get_weight()) {
                $features[] = 'Weight: ' . $product->get_weight() . ' ' . get_option('woocommerce_weight_unit');
            }
            if ($product->get_dimensions()) {
                $features[] = 'Dimensions: ' . wc_format_dimensions($product->get_dimensions());
            }
        }
        
        // Get target audience from tags or custom field
        $tags = wp_get_post_terms($product->get_id(), 'product_tag', array('fields' => 'names'));
        $target_audience = !empty($tags) ? implode(', ', $tags) : 'General consumers';
        
        return array(
            'name' => $product->get_name(),
            'category' => $category,
            'features' => implode("\n", $features),
            'target_audience' => $target_audience,
            'tone' => $options['tone'] ?? get_option('pdio_default_tone', 'professional'),
            'generate_images' => $options['generate_images'] ?? (get_option('pdio_generate_images') === 'yes')
        );
    }
    
    /**
     * Save generated images
     */
    private function save_generated_images($product_id, $images) {
        require_once(ABSPATH . 'wp-admin/includes/media.php');
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        require_once(ABSPATH . 'wp-admin/includes/image.php');
        
        $gallery_ids = array();
        
        foreach ($images as $index => $image_url) {
            // Download image
            $tmp = download_url($image_url);
            
            if (is_wp_error($tmp)) {
                continue;
            }
            
            $file_array = array(
                'name' => 'product-' . $product_id . '-ai-' . ($index + 1) . '.jpg',
                'tmp_name' => $tmp
            );
            
            // Upload to media library
            $attachment_id = media_handle_sideload($file_array, $product_id, 
                'AI Generated Image for Product #' . $product_id);
            
            if (!is_wp_error($attachment_id)) {
                if ($index === 0 && !has_post_thumbnail($product_id)) {
                    // Set first image as featured image if none exists
                    set_post_thumbnail($product_id, $attachment_id);
                } else {
                    // Add to gallery
                    $gallery_ids[] = $attachment_id;
                }
            }
        }
        
        // Update product gallery
        if (!empty($gallery_ids)) {
            $product = wc_get_product($product_id);
            $existing_gallery = $product->get_gallery_image_ids();
            $product->set_gallery_image_ids(array_merge($existing_gallery, $gallery_ids));
            $product->save();
        }
    }
    
    /**
     * Log generation
     */
    private function log_generation($product_id, $result) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'pdio_generation_log';
        
        $wpdb->insert($table_name, array(
            'product_id' => $product_id,
            'description_count' => count($result['descriptions'] ?? array()),
            'image_count' => count($result['images'] ?? array()),
            'status' => 'success'
        ));
    }
    
    /**
     * Update usage stats
     */
    private function update_stats($result) {
        $stats = get_option('pdio_usage_stats', array());
        $stats['descriptions_generated'] = ($stats['descriptions_generated'] ?? 0) + 1;
        $stats['images_generated'] = ($stats['images_generated'] ?? 0) + count($result['images'] ?? array());
        update_option('pdio_usage_stats', $stats);
    }
    
    /**
     * Auto-generate description for new products
     */
    public function auto_generate_description($product_id) {
        $product = wc_get_product($product_id);
        
        // Only generate if description is empty
        if (empty($product->get_description())) {
            $this->generate_for_product($product_id);
        }
    }
    
    /**
     * Maybe auto-generate on update
     */
    public function maybe_auto_generate($product_id) {
        $product = wc_get_product($product_id);
        
        // Check if description was cleared
        if (empty($product->get_description()) && get_option('pdio_auto_generate_on_empty') === 'yes') {
            $this->generate_for_product($product_id);
        }
    }
}