export type civiliteTypes = 'Homme' | 'Femme' | 'NB';
export type roleTypes = 'Guerrier' | 'Alchimiste' | 'Sorcier' | 'Espions' | 'Enchanteur';
export const allTypes = () => {
    return {
        civiliteTypesTab: ['Homme' , 'Femme', 'NB'] as civiliteTypes[],
        roleTypesTab: ['Guerrier', 'Alchimiste' , 'Sorcier' , 'Espions', 'Enchanteur'] as roleTypes[],
    }        
}