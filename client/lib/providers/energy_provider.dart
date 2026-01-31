import 'package:flutter/material.dart';
import 'package:shadowapp/models/bill_model.dart';

class EnergyProvider extends ChangeNotifier {
  BillModel? currentBill;

  void setMockBill() {
    currentBill = BillModel(
      id: "101",
      totalAmount: 5000.0,
      unitsConsumed: 450.0,
      billingDate: DateTime.now(),
      applianceBreakdown: {
        "AC": 2500.0,
        "Fridge": 800.0,
        "Lights": 500.0,
      },
      shadowWaste: 1200.0,
    );

    notifyListeners(); 
  }
}
