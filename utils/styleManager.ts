import stylesConfig from '../config/styles.json';

export interface StyleOption {
  id: string;
  name: string;
  emoji: string;
  description: string;
  thumbnail: string;
  category: string;
  enabled: boolean;
  popularity: number;
  prompt: string;
}

export interface CustomStyle {
  id: string;
  name: string;
  emoji: string;
  description: string;
  prompt: string;
  category: 'custom';
  createdAt: string;
}

class StyleManager {
  private customStyles: CustomStyle[] = [];

  /**
   * Get all enabled predefined styles
   */
  getPredefinedStyles(t: (key: string) => string): StyleOption[] {
    return stylesConfig.predefinedStyles
      .filter(style => style.enabled)
      .sort((a, b) => b.popularity - a.popularity)
      .map(style => ({
        id: style.id,
        name: t(`styles.${style.id}.name`),
        emoji: style.emoji,
        description: t(`styles.${style.id}.description`),
        thumbnail: `/api/placeholder/120/120`,
        category: style.category,
        enabled: style.enabled,
        popularity: style.popularity,
        prompt: style.prompt
      }));
  }

  /**
   * Get all styles (predefined + custom)
   */
  getAllStyles(t: (key: string) => string): StyleOption[] {
    const predefined = this.getPredefinedStyles(t);
    const custom = this.getCustomStyles();
    
    return [...predefined, ...custom];
  }

  /**
   * Get custom styles created by user
   */
  getCustomStyles(): StyleOption[] {
    return this.customStyles.map(style => ({
      ...style,
      thumbnail: `/api/placeholder/120/120`,
      enabled: true,
      popularity: 1
    }));
  }

  /**
   * Add a new custom style
   */
  addCustomStyle(customStyle: Omit<CustomStyle, 'id' | 'createdAt'>): CustomStyle {
    const newStyle: CustomStyle = {
      ...customStyle,
      id: `custom-${Date.now()}`,
      category: 'custom',
      createdAt: new Date().toISOString()
    };

    this.customStyles.push(newStyle);
    this.saveCustomStyles();
    return newStyle;
  }

  /**
   * Remove a custom style
   */
  removeCustomStyle(styleId: string): boolean {
    const initialLength = this.customStyles.length;
    this.customStyles = this.customStyles.filter(style => style.id !== styleId);
    
    if (this.customStyles.length < initialLength) {
      this.saveCustomStyles();
      return true;
    }
    return false;
  }

  /**
   * Get style by ID (predefined or custom)
   */
  getStyleById(styleId: string, t: (key: string) => string): StyleOption | null {
    const allStyles = this.getAllStyles(t);
    return allStyles.find(style => style.id === styleId) || null;
  }

  /**
   * Get styles by category
   */
  getStylesByCategory(category: string, t: (key: string) => string): StyleOption[] {
    return this.getAllStyles(t).filter(style => style.category === category);
  }

  /**
   * Get available categories
   */
  getCategories(): { [key: string]: string } {
    return stylesConfig.categories;
  }

  /**
   * Check if custom styles are enabled
   */
  isCustomStyleEnabled(): boolean {
    return stylesConfig.customStyleConfig.enabled;
  }

  /**
   * Get custom style configuration
   */
  getCustomStyleConfig() {
    return stylesConfig.customStyleConfig;
  }

  /**
   * Save custom styles to localStorage
   */
  private saveCustomStyles(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('customStyles', JSON.stringify(this.customStyles));
    }
  }

  /**
   * Load custom styles from localStorage
   */
  loadCustomStyles(): void {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('customStyles');
      if (saved) {
        try {
          this.customStyles = JSON.parse(saved);
        } catch (error) {
          console.error('Failed to load custom styles:', error);
          this.customStyles = [];
        }
      }
    }
  }

  /**
   * Export all styles for backup
   */
  exportStyles(): { predefined: any[], custom: CustomStyle[] } {
    return {
      predefined: stylesConfig.predefinedStyles,
      custom: this.customStyles
    };
  }

  /**
   * Import custom styles from backup
   */
  importCustomStyles(styles: CustomStyle[]): void {
    this.customStyles = styles;
    this.saveCustomStyles();
  }
}

// Export singleton instance
export const styleManager = new StyleManager();