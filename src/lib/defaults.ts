
import type { BuildingData, Unit } from './types';

// This function now generates units with a much more explicit data structure.
const generateUnits = (
    buildingId: number,
    floor: number,
    unitType: 'apartment' | 'suite',
    count: number,
    startNumber: number
): Unit[] => {
    const defaultRent = unitType === 'apartment' ? 1700 : 3000;
    return Array.from({ length: count }, (_, i) => {
        const unitNumber = startNumber + i;
        const unitId = `B${buildingId}-F${floor}-${unitType === 'apartment' ? 'A' : 'S'}${unitNumber.toString().padStart(3, '0')}`;
        return {
            id: unitId,
            buildingId: buildingId,
            floor: floor,
            unitType: unitType,
            unitNumber: unitNumber,
            status: 'rented',
            paymentStatus: 'paid',
            baseRent: defaultRent,
            actualRent: defaultRent,
            rentDate: new Date().toISOString().split('T')[0],
            maintenanceHistory: [], // Initialize with an empty history
            claimHistory: [],
        };
    });
};

const createBuilding = (id: number, name: string): BuildingData => {
    // This configuration is now the source of truth for building structure.
    const floorConfig = [
        { floor: 1, apartments: 16, suites: 4 },
        { floor: 2, apartments: 36, suites: 2 },
        { floor: 3, apartments: 36, suites: 2 },
        { floor: 4, apartments: 36, suites: 2 },
    ];

    let allApartments: Unit[] = [];
    let allSuites: Unit[] = [];
    let aptStartNumber = 1;
    let suiteStartNumber = 1;

    floorConfig.forEach(fc => {
        const floorApts = generateUnits(id, fc.floor, 'apartment', fc.apartments, aptStartNumber);
        allApartments.push(...floorApts);
        aptStartNumber += fc.apartments;

        const floorSuites = generateUnits(id, fc.floor, 'suite', fc.suites, suiteStartNumber);
        allSuites.push(...floorSuites);
        suiteStartNumber += fc.suites;
    });

    return {
        id,
        name,
        apartments: {
            total: allApartments.length,
            rented: allApartments.filter(u => u.status === 'rented').length,
            rent: 1700, // Default average rent
            units: allApartments,
        },
        suites: {
            total: allSuites.length,
            rented: allSuites.filter(u => u.status === 'rented').length,
            rent: 3000, // Default average rent
            units: allSuites,
        },
    };
};

export const initialBuildings: BuildingData[] = [
    createBuilding(1, "مبنى 1"),
    createBuilding(2, "مبنى 2"),
    createBuilding(3, "مبنى 3"),
    createBuilding(4, "مبنى 4"),
    createBuilding(5, "مبنى 5"),
    createBuilding(6, "مبنى 6"),
    createBuilding(7, "مبنى 7"),
    createBuilding(8, "مبنى 8"),
];
