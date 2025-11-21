/**
 * 🎨 Custom-Only Categories Configuration
 * 
 * Ces catégories sont EXCLUSIVEMENT pour le service Sur-Mesure.
 * Elles ne doivent JAMAIS apparaître dans le catalogue standard ou la homepage.
 * 
 * Raison: Ces produits nécessitent:
 * - Consultation personnalisée
 * - Prise de mesures
 * - Devis sur-mesure
 * - Création personnalisée
 */

/**
 * Catégories réservées au service Sur-Mesure UNIQUEMENT
 * 
 * ⚠️ NE PAS afficher dans:
 * - Catalogue standard
 * - Featured Products (homepage)
 * - Recherche générale
 * 
 * ✅ Afficher UNIQUEMENT dans:
 * - Page /sur-mesure
 */
export const CUSTOM_ONLY_CATEGORIES = [
    'robes-mariage',
    'robes-ceremonie',
    'costumes-africains',
] as const;

/**
 * Informations tarifaires pour les catégories sur-mesure
 */
export const CUSTOM_CATEGORY_INFO = {
    'robes-mariage': {
        minPrice: 100000,
        currency: 'FCFA',
        specialOffer: 'Voile offert avec chaque commande sur-mesure',
    },
    'robes-ceremonie': {
        minPrice: 20000,
        currency: 'FCFA',
    },
    'costumes-africains': {
        minPrice: 20000,
        currency: 'FCFA',
        note: 'Prix variables selon modèle choisi',
    },
} as const;

/**
 * Type helper pour les catégories sur-mesure
 */
export type CustomOnlyCategory = typeof CUSTOM_ONLY_CATEGORIES[number];

/**
 * Vérifie si une catégorie est réservée au sur-mesure
 */
export function isCustomOnlyCategory(category: string): category is CustomOnlyCategory {
    return CUSTOM_ONLY_CATEGORIES.includes(category as CustomOnlyCategory);
}

/**
 * Filtre les catégories pour exclure celles réservées au sur-mesure
 * 
 * @example
 * const allCategories = ['robes', 'robes-mariage', 'ensembles'];
 * const catalogCategories = filterOutCustomCategories(allCategories);
 * // Returns: ['robes', 'ensembles']
 */
export function filterOutCustomCategories<T extends string>(categories: T[]): T[] {
    return categories.filter(cat => !CUSTOM_ONLY_CATEGORIES.includes(cat as any));
}

/**
 * Obtient les informations d'une catégorie sur-mesure
 */
export function getCustomCategoryInfo(category: CustomOnlyCategory) {
    return CUSTOM_CATEGORY_INFO[category];
}
