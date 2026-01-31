class BillModel {
  final String id;
  final double totalAmount;
  final double unitsConsumed;
  final DateTime billingDate;
  final Map<String, double> applianceBreakdown; // e.g., {"AC": 45.0, "Fridge": 20.0}
  final double shadowWaste; // The "Vampire Load" we calculated

  BillModel({
    required this.id,
    required this.totalAmount,
    required this.unitsConsumed,
    required this.billingDate,
    required this.applianceBreakdown,
    required this.shadowWaste,
  });

  // This converts the JSON from Shubham's API into this Flutter Object
  factory BillModel.fromJson(Map<String, dynamic> json) {
    return BillModel(
      id: json['id'] ?? '',
      totalAmount: (json['totalAmount'] ?? 0.0).toDouble(),
      unitsConsumed: (json['unitsConsumed'] ?? 0.0).toDouble(),
      billingDate: DateTime.parse(json['billingDate'] ?? DateTime.now().toString()),
      applianceBreakdown: Map<String, double>.from(json['breakdown'] ?? {}),
      shadowWaste: (json['shadowWaste'] ?? 0.0).toDouble(),
    );
  }
}