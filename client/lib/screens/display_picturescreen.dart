import 'package:flutter/material.dart';
import 'dart:io';
import 'dart:convert'; // Required for jsonDecode
import 'package:http/http.dart' as http; // Make sure to run 'flutter pub add http'

class DisplayPictureScreen extends StatelessWidget {
  final String imagePath;

  const DisplayPictureScreen({super.key, required this.imagePath});

  // --- ADD THE FUNCTION HERE ---
  Future<void> uploadBill(BuildContext context, String filePath) async {
    // 1. Show a loading dialog
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(
        child: CircularProgressIndicator(color: Colors.deepPurple),
      ),
    );

    try {
      // Replace with your Lead's actual IP. Example: 'http://192.168.1.5:5000/upload'
      var url = Uri.parse('http://YOUR_BACKEND_IP:5000/upload'); 
      
      var request = http.MultipartRequest('POST', url);
      request.files.add(await http.MultipartFile.fromPath('bill_image', filePath));

      var streamedResponse = await request.send();
      var response = await http.Response.fromStream(streamedResponse);

      // Close the loading dialog
      if (context.mounted) Navigator.pop(context);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        print("✅ Success: ${data}");
        
        // Show success message
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Bill Processed Successfully!")),
        );
        
        // Go back to Home/Dashboard
        Navigator.pop(context); 
      } else {
        throw Exception("Server returned ${response.statusCode}");
      }
    } catch (e) {
      if (context.mounted) Navigator.pop(context); // Close loader on error
      print("❌ Upload Error: $e");
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Upload Failed: $e")),
      );
    }
  }
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Confirm Bill Scan')),
      body: Column(
        children: [
          Expanded(child: Image.file(File(imagePath))), // Show the captured image
          Padding(
            padding: const EdgeInsets.all(20.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                ElevatedButton(
                  onPressed: () => Navigator.pop(context), // Go back to re-take
                  child: const Text("Retake"),
                ),
                // UPDATE THIS BUTTON HERE:
                ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.deepPurple),
                  onPressed: () {
                    // 1. Show the "Thinking..." spinner
                      showDialog(
                        context: context,
                        barrierDismissible: false,
                        builder: (context) => const Center(
                          child: CircularProgressIndicator(color: Colors.white),
                        ),
                      );

                      // 2. Run the upload function
                      // Note: Make sure uploadBill(context, imagePath) matches your function name
                      uploadBill(context, imagePath).then((_) {
                        // The dialog is usually closed inside the uploadBill function 
                        // but we keep this as a safety net.
                      });
                    },
                    child: const Text("PROCEED", style: TextStyle(color: Colors.white)),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}