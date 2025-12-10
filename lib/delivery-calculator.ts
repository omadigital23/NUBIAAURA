/**
 * Utilitaire pour calculer les délais de livraison et de retour
 * basés sur la localisation (Sénégal vs International)
 */

/**
 * Vérifie si un pays est le Sénégal
 */
export function isSenegal(country: string): boolean {
    const normalized = country.toLowerCase().trim();
    return normalized === 'senegal' ||
        normalized === 'sénégal' ||
        normalized === 'sn' ||
        normalized === 'sen';
}

/**
 * Calcule la durée de livraison en jours selon le pays et le type de commande
 * 
 * @param country - Pays de livraison
 * @param isCustomOrder - true si commande sur-mesure, false si achat normal
 * @returns Nombre de jours pour la livraison
 * 
 * Règles:
 * - Achats normaux Sénégal: 1-3 jours
 * - Achats normaux International: 3-7 jours
 * - Commandes sur-mesure (tous pays): 10-20 jours
 */
export function calculateDeliveryDuration(
    country: string,
    isCustomOrder: boolean = false
): number {
    if (isCustomOrder) {
        // Commandes sur-mesure: 10-20 jours (Sénégal et International)
        return Math.floor(Math.random() * 11) + 10;
    }

    if (isSenegal(country)) {
        // Sénégal: 1-3 jours
        return Math.floor(Math.random() * 3) + 1;
    }

    // International: 3-7 jours
    return Math.floor(Math.random() * 5) + 3;
}

/**
 * Calcule la date limite pour demander un retour
 * 
 * @param country - Pays de livraison
 * @param deliveredAt - Date de livraison
 * @returns Date limite pour retour
 * 
 * Règles:
 * - Sénégal: 3 jours après réception
 * - International: 14 jours après réception
 */
export function calculateReturnDeadline(
    country: string,
    deliveredAt: Date
): Date {
    const deadline = new Date(deliveredAt);

    if (isSenegal(country)) {
        // Sénégal: 3 jours
        deadline.setDate(deadline.getDate() + 3);
    } else {
        // International: 14 jours
        deadline.setDate(deadline.getDate() + 14);
    }

    return deadline;
}

/**
 * Obtient le nombre de jours pour la période de retour
 * 
 * @param country - Pays de livraison
 * @returns Nombre de jours pour retour
 */
export function getReturnPeriodDays(country: string): number {
    return isSenegal(country) ? 3 : 14;
}

/**
 * Vérifie si une demande de retour est dans les délais
 * 
 * @param country - Pays de livraison
 * @param deliveredAt - Date de livraison
 * @param requestDate - Date de la demande de retour (par défaut: maintenant)
 * @returns true si dans les délais, false sinon
 */
export function isReturnEligible(
    country: string,
    deliveredAt: Date,
    requestDate: Date = new Date()
): boolean {
    const deadline = calculateReturnDeadline(country, deliveredAt);
    return requestDate <= deadline;
}
