
export interface PaymentInstallment {
  amount: number;
  dueDate: string;
  isPaid: boolean;
}

export interface PaymentPlan {
  type: 'exempt' | 'installment' | 'deferred' | 'stipend' | 'scholarship';
  notes?: string;
  deferredUntil?: string; // For deferred type
  installments?: PaymentInstallment[]; // For installment type
  stipendDeductions?: PaymentInstallment[]; // For stipend type
  completedDate?: string; // Date when the plan was fully paid
}

export interface ClaimRecord {
  id: string;
  date: string;
  action: string;
}

export interface MaintenanceRecord {
  id: string; // Unique ID for the maintenance record
  startDate: string;
  endDate: string; // Actual completion date
  expectedEndDate?: string; // Expected completion date
  cost: number;
  type: 'maintenance' | 'furniture' | 'electrical' | 'painting' | 'none';
  description: string;
}

export interface Unit {
  id: string; // Unique ID for the unit, e.g., "B1-F1-A01"
  buildingId: number; // Explicit building ID
  floor: number; // Explicit floor number
  unitType: 'apartment' | 'suite'; // Explicit unit type
  unitNumber: number; // Sequential number of the unit within its type in the building

  status: 'rented' | 'under_maintenance' | 'available' | 'office';
  statusBeforeMaintenance?: 'rented' | 'available' | 'office';
  paymentStatus?: 'paid' | 'deferred' | 'exempt' | 'payment_plan' | 'scholarship' | 'paid_in_full';
  
  // Active Maintenance Fields - only used when status is 'under_maintenance'
  vacancyReason?: 'maintenance' | 'furniture' | 'electrical' | 'painting' | 'none';
  maintenanceCost?: number;
  maintenanceStartDate?: string;
  maintenanceEndDate?: string;
  
  baseRent: number;
  actualRent?: number; // The manually entered actual rent
  rentDate?: string | null; 
  
  maintenanceHistory: MaintenanceRecord[];
  paymentPlan?: PaymentPlan;
  claimHistory: ClaimRecord[];
  planArchived?: boolean; // New flag to keep it in the completed list
}

export interface NewUnitData {
    unitNumber: number;
    baseRent: number;
}

export interface RoomData {
  total: number;
  rented: number;
  rent: number; // This might become an average or default, as baseRent is now per unit
  units: Unit[];
}

export interface BuildingData {
  id: number;
  name: string;
  apartments: RoomData;
  suites: RoomData;
}

export type NewBuildingData = Omit<BuildingData, 'id'>;

export interface SemesterData {
  apartmentRent: number;
  rentedApartments: number;
  suiteRent: number;
  rentedSuites: number;
  expenses: number;
}

export interface YearlyForecastInput {
  year: number;
  semesters: [SemesterData, SemesterData];
}
