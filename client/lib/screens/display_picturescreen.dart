import 'package:flutter/material.dart';
import 'dart:io';
import 'package:shadowapp/screens/applianceselection_screen.dart';

class DisplayPictureScreen extends StatelessWidget {
  final String imagePath;

  const DisplayPictureScreen({super.key, required this.imagePath});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D0221), // Midnight Black theme
      appBar: AppBar(
        title: const Text('Confirm Bill Scan', style: TextStyle(color: Colors.white)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: Column(
        children: [
          // 1. Image Preview Area
          Expanded(
            child: Container(
              margin: const EdgeInsets.all(15),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFBD93F9).withOpacity(0.3)),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: Image.file(
                  File(imagePath),
                  fit: BoxFit.contain,
                ),
              ),
            ),
          ),

          // 2. Info Text
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 30),
            child: Text(
              "Does the image look clear? Make sure the bill amount and dates are visible.",
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white54, fontSize: 14),
            ),
          ),

          // 3. Action Buttons
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 30),
            child: Row(
              children: [
                // RETAKE BUTTON
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 15),
                      side: const BorderSide(color: Color(0xFFBD93F9)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                    ),
                    child: const Text("RETAKE", style: TextStyle(color: Color(0xFFBD93F9))),
                  ),
                ),
                
                const SizedBox(width: 15),

                // PROCEED BUTTON (Triggers Navigation)
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      // 🚀 Direct Navigation: No API call here
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => ApplianceSelectionScreen(imagePath: imagePath),
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFBD93F9),
                      padding: const EdgeInsets.symmetric(vertical: 15),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                    ),
                    child: const Text(
                      "PROCEED",
                      style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}