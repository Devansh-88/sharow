import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:dio/dio.dart';
import '../services/api_client.dart';

class ApplianceSelectionScreen extends StatefulWidget {
  final String imagePath; // Change billId to imagePath
  const ApplianceSelectionScreen({super.key, required this.imagePath});

  @override
  State<ApplianceSelectionScreen> createState() => _ApplianceSelectionScreenState();
}

class _ApplianceSelectionScreenState extends State<ApplianceSelectionScreen> {
  final List<Map<String, dynamic>> _appliances = [
    {"name": "Air Conditioner", "isSelected": false, "hours": 0.0, "icon": Icons.ac_unit},
    {"name": "Refrigerator", "isSelected": false, "hours": 24.0, "icon": Icons.kitchen},
    {"name": "Washing Machine", "isSelected": false, "hours": 0.0, "icon": Icons.local_laundry_service},
    {"name": "Geyser", "isSelected": false, "hours": 0.0, "icon": Icons.hot_tub},
    {"name": "Television", "isSelected": false, "hours": 0.0, "icon": Icons.tv},
  ];

  Future<void> _submitData() async {
    // 1. Prepare Appliances List
    List<Map<String, dynamic>> applianceData = _appliances
        .where((a) => a['isSelected'] == true)
        .map((a) => {
              "name": a['name'],
              "avgUsageHours": a['hours'],
            })
        .toList();

    if (applianceData.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please select at least one appliance")),
      );
      return;
    }

    // 2. Show Processing Spinner
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(
        child: CircularProgressIndicator(color: Color(0xFFBD93F9), strokeWidth: 5),
      ),
    );

    try {
      // 3. Prepare Multipart Data (Image + Appliances)
      String fileName = widget.imagePath.split('/').last;
      
      // We use jsonEncode because MultipartRequest usually expects strings for non-file fields
      FormData formData = FormData.fromMap({
        "bill_image": await MultipartFile.fromFile(widget.imagePath, filename: fileName),
        "appliances": jsonEncode(applianceData), 
      });

      // 4. Hit the combined endpoint
      final response = await ApiClient.instance.post(
        '/bills/analyze', // Ensure your backend handles req.file AND req.body.appliances
        data: formData,
      );

      if (context.mounted) Navigator.pop(context); // Close Spinner

      if (response.data['success'] == true) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text("Setup Complete!"), backgroundColor: Colors.green),
          );
          // Return to Dashboard
          Navigator.of(context).popUntil((route) => route.isFirst);
        }
      } else {
        throw Exception(response.data['message'] ?? "Failed to process bill");
      }
    } catch (e) {
      if (context.mounted) Navigator.pop(context); // Close Spinner
      print("❌ Final Submit Error: $e");
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Error: ${e.toString()}"), backgroundColor: Colors.redAccent),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D0221),
      appBar: AppBar(
        title: const Text("Appliance Setup", style: TextStyle(color: Colors.white)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: Column(
        children: [
          const Padding(
            padding: EdgeInsets.all(20.0),
            child: Text(
              "Final Step: Select your appliances and usage to analyze your bill.",
              style: TextStyle(color: Colors.white70, fontSize: 16),
            ),
          ),
          Expanded(
            child: ListView.builder(
              itemCount: _appliances.length,
              itemBuilder: (context, index) {
                final item = _appliances[index];
                return AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  decoration: BoxDecoration(
                    color: item['isSelected'] 
                        ? const Color(0xFFBD93F9).withOpacity(0.1) 
                        : const Color(0xFF1B1464).withOpacity(0.3),
                    borderRadius: BorderRadius.circular(15),
                    border: Border.all(
                      color: item['isSelected'] ? const Color(0xFFBD93F9) : Colors.transparent,
                    ),
                  ),
                  child: Column(
                    children: [
                      CheckboxListTile(
                        title: Text(item['name'], style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                        secondary: Icon(item['icon'], color: const Color(0xFFBD93F9)),
                        value: item['isSelected'],
                        activeColor: const Color(0xFFBD93F9),
                        onChanged: (val) => setState(() => item['isSelected'] = val),
                      ),
                      if (item['isSelected'])
                        Padding(
                          padding: const EdgeInsets.fromLTRB(20, 0, 20, 15),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text("Daily Usage", style: TextStyle(color: Colors.white60)),
                                  Text("${item['hours'].toInt()} Hours", style: const TextStyle(color: Color(0xFFBD93F9), fontWeight: FontWeight.bold)),
                                ],
                              ),
                              Slider(
                                value: item['hours'],
                                min: 0, max: 24, divisions: 24,
                                activeColor: const Color(0xFFBD93F9),
                                inactiveColor: Colors.white10,
                                onChanged: (val) => setState(() => item['hours'] = val),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                );
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(24.0),
            child: ElevatedButton(
              onPressed: _submitData,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFBD93F9),
                minimumSize: const Size(double.infinity, 55),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
              ),
              child: const Text("ANALYZE & FINISH", style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 16)),
            ),
          ),
        ],
      ),
    );
  }
}