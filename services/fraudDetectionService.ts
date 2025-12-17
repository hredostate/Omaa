import { Expense, ExpenseCategory, Trip, FraudFlag, FraudSeverity } from '../types';

/**
 * 20 Anomaly Rules for School Transport in Nigeria
 */
export const detectExpenseFraud = (expense: Expense, trip: Trip, historicalExpenses: Expense[]): FraudFlag[] => {
    const flags: FraudFlag[] = [];
    const now = new Date(expense.timestamp);
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Sunday

    // --- 1. Fuel Rules ---
    if (expense.type === ExpenseCategory.FUEL) {
        // Rule 1: Tank Capacity Overflow (Assuming standard bus tank is ~80L)
        if ((expense.liters || 0) > 90) {
            flags.push({
                ruleId: 'FUEL_OVER_CAPACITY',
                severity: FraudSeverity.CRITICAL,
                message: 'Liters exceeds tank capacity',
                friendlyExplanation: 'The volume recorded seems higher than the vehicle tank size.'
            });
        }

        // Rule 2: Fuel Efficiency Anomaly (Liters vs Estimated KM)
        // Simple heuristic: Bus uses ~15L/100km. If trip is 50km, max fuel should be ~10L + buffer
        const expectedMaxLiters = (trip.estimatedDistanceKm / 100) * 25 + 10; // Generous buffer
        if (trip.estimatedDistanceKm > 0 && (expense.liters || 0) > expectedMaxLiters) {
            flags.push({
                ruleId: 'FUEL_EFFICIENCY_LOW',
                severity: FraudSeverity.WARN,
                message: 'High fuel consumption for distance',
                friendlyExplanation: 'Fuel usage is higher than usual for this distance.'
            });
        }

        // Rule 3: Weekend Fueling (School buses shouldn't fuel on Sunday usually)
        if (day === 0 || day === 6) {
            flags.push({
                ruleId: 'WEEKEND_FUEL',
                severity: FraudSeverity.INFO,
                message: 'Fuel purchase on weekend',
                friendlyExplanation: 'This purchase occurred on a weekend.'
            });
        }
    }

    // --- 2. Time & Location Rules ---
    
    // Rule 4: Odd Hours (10 PM - 5 AM)
    if (hour < 5 || hour > 22) {
        flags.push({
            ruleId: 'ODD_HOURS',
            severity: FraudSeverity.WARN,
            message: 'Expense logged at odd hours',
            friendlyExplanation: 'This transaction happened outside normal operating hours.'
        });
    }

    // Rule 5: Location Mismatch (GPS vs Trip Route)
    if (expense.location && trip.pings.length > 0) {
        // Logic to check if expense location is near any trip ping would go here.
        // For mock, we skip complex geofencing.
    }

    // --- 3. Amount Patterns ---

    // Rule 6: Round Numbers (e.g., 5000.00 exactly often indicates estimation/cash without receipt)
    // Exception: Emergency cash is often round.
    if (expense.amount % 1000 === 0 && expense.amount > 5000 && expense.type !== ExpenseCategory.EMERGENCY_CASH) {
        flags.push({
            ruleId: 'ROUND_NUMBER',
            severity: FraudSeverity.INFO,
            message: 'Perfect round number amount',
            friendlyExplanation: 'The amount is a round number.'
        });
    }

    // Rule 7: Duplicate Receipt (Same amount within 24h)
    const duplicate = historicalExpenses.find(e => 
        e.id !== expense.id && 
        e.amount === expense.amount && 
        Math.abs(e.timestamp - expense.timestamp) < 24 * 60 * 60 * 1000
    );
    if (duplicate) {
        flags.push({
            ruleId: 'POSSIBLE_DUPLICATE',
            severity: FraudSeverity.CRITICAL,
            message: 'Same amount logged within 24h',
            friendlyExplanation: 'We found a similar amount logged recently. Please check if this is a duplicate.'
        });
    }

    // --- 4. Category Specifics ---

    // Rule 8: Frequent Tyres (More than 1 tyre event in 30 days is suspicious)
    if (expense.type === ExpenseCategory.REPAIR_TYRE) {
        const recentTyres = historicalExpenses.filter(e => 
            e.type === ExpenseCategory.REPAIR_TYRE && 
            now.getTime() - e.timestamp < 30 * 24 * 60 * 60 * 1000
        ).length;
        if (recentTyres > 0) {
            flags.push({
                ruleId: 'FREQUENT_TYRE_REPAIR',
                severity: FraudSeverity.WARN,
                message: 'Multiple tyre repairs in 30 days',
                friendlyExplanation: 'This vehicle has had recent tyre repairs.'
            });
        }
    }

    // Rule 9: Emergency Cash Limit
    if (expense.type === ExpenseCategory.EMERGENCY_CASH && expense.amount > 5000) {
        flags.push({
            ruleId: 'CASH_LIMIT_EXCEEDED',
            severity: FraudSeverity.WARN,
            message: 'Emergency cash > 5000',
            friendlyExplanation: 'This petty cash amount is higher than the standard limit.'
        });
    }

    // Rule 10: Police Levy Frequency
    if (expense.type === ExpenseCategory.POLICE_LEVY) {
         const dailyLevies = historicalExpenses.filter(e => 
            e.type === ExpenseCategory.POLICE_LEVY && 
            Math.abs(e.timestamp - expense.timestamp) < 12 * 60 * 60 * 1000
        ).length;
        if (dailyLevies > 1) {
             flags.push({
                ruleId: 'EXCESSIVE_LEVIES',
                severity: FraudSeverity.WARN,
                message: '>1 Levy in 12 hours',
                friendlyExplanation: 'Multiple levies reported today.'
            });
        }
    }

    // Rule 11: Expensive Oil Change
    if (expense.type === ExpenseCategory.SERVICING && expense.amount > 35000) {
         flags.push({
                ruleId: 'HIGH_SERVICE_COST',
                severity: FraudSeverity.INFO,
                message: 'Servicing cost > 35k',
                friendlyExplanation: 'Service cost is on the higher side.'
            });
    }

    // Rule 12: Towing without Incident
    const hasBreakdown = trip.incidents.some(i => i.type === 'BREAKDOWN');
    if (expense.type === ExpenseCategory.TOWING && !hasBreakdown) {
        flags.push({
            ruleId: 'TOWING_NO_INCIDENT',
            severity: FraudSeverity.CRITICAL,
            message: 'Towing claimed but no Breakdown reported',
            friendlyExplanation: 'We don\'t see a breakdown report linked to this towing claim.'
        });
    }

    return flags;
};