/**
 * Utilitaire pour calculer les délais de livraison et de retour
 * basés sur la localisation (Sénégal vs International)
 * 
 * DÉLAIS OFFICIELS NUBIA AURA:
 * - Standard Sénégal: 3-5 jours
 * - Standard International: 7-14 jours
 * - Sur-mesure (tous pays): 2-3 semaines
 * - Retours Sénégal: 3 jours
 * - Retours International: 14 jours
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
 * - Standard Sénégal: 3-5 jours
 * - Standard International: 7-14 jours
 * - Sur-mesure (tous pays): 14-21 jours (2-3 semaines)
 */
export function calculateDeliveryDuration(
    country: string,
    isCustomOrder: boolean = false
): number {
    if (isCustomOrder) {
        // Commandes sur-mesure: 14-21 jours (2-3 semaines)
        return Math.floor(Math.random() * 8) + 14;
    }

    if (isSenegal(country)) {
        // Sénégal: 3-5 jours
        return Math.floor(Math.random() * 3) + 3;
    }

    // International: 7-14 jours
    return Math.floor(Math.random() * 8) + 7;
}

/**
 * Obtient la plage de livraison en texte
 */
export function getDeliveryRangeText(
    country: string,
    isCustomOrder: boolean = false,
    locale: string = 'fr'
): string {
    if (isCustomOrder) {
        return locale === 'fr' ? '2-3 semaines' : '2-3 weeks';
    }

    if (isSenegal(country)) {
        return locale === 'fr' ? '3-5 jours' : '3-5 days';
    }

    return locale === 'fr' ? '7-14 jours' : '7-14 days';
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
