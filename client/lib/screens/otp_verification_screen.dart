import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shadowapp/providers/user_provider.dart';
import 'package:shadowapp/screens/home_dashboard.dart';
import 'package:shadowapp/services/api_client.dart';
import 'package:dio/dio.dart'; // <--- 1. Is import ko zaroor check karein

class OtpVerificationScreen extends StatefulWidget {
  const OtpVerificationScreen({super.key});

  @override
  State<OtpVerificationScreen> createState() => _OtpVerificationScreenState();
}

class _OtpVerificationScreenState extends State<OtpVerificationScreen> {
  final List<TextEditingController> _controllers = List.generate(6, (_) => TextEditingController());

  @override
  void dispose() {
    // Controller dispose karna acchi practice hai
    for (var controller in _controllers) {
      controller.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D0221),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: 40),
              const Icon(Icons.lock_outline_rounded, color: Color(0xFFBD93F9), size: 80),
              const SizedBox(height: 30),
              const Text(
                "Verification Code",
                style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 10),
              const Text(
                "Please enter the 6-digit code sent to your email.",
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white54, fontSize: 16),
              ),
              const SizedBox(height: 50),
        
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: List.generate(6, (index) => _buildOtpField(index)),
              ),
        
              const SizedBox(height: 50),
        
              SizedBox(
                width: double.infinity,
                height: 55,
                child: ElevatedButton(
                  onPressed: () async {
                  // 1. Join the 6 digits into one string
                  String otp = _controllers.map((e) => e.text).join();

                  if (otp.length < 6) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text("Please enter the full 6-digit code")),
                    );
                    return;
                  }

                  try {
                    // 2. API call
                    final response = await ApiClient.instance.post(
                      '/auth/signup/verify',
                      data: {'otp': otp},
                    );

                    // Backend bhej raha hai: { success: true, data: { user: {...}, accessToken: "..." }, ... }
                    if (response.data['success'] == true) {
                      print(response.data); // DEBUG
                      final innerData = response.data; // 'data' object pakda
                      
                      final userData = innerData['user'];      // sibling 1
                      final token = innerData['accessToken']; // sibling 2

                      if (context.mounted && userData != null && token != null) {
                        // 3. Update Provider with both (Saves to SharedPreferences automatically)
                        await Provider.of<UserProvider>(context, listen: false).setUser(userData, token);

                        // 4. Navigate to Home
                        Navigator.pushAndRemoveUntil(
                          context,
                          MaterialPageRoute(builder: (context) => const HomeDashboard()),
                          (route) => false,
                        );
                      }
                    }
                  } on DioException catch (e) {
                    // 5. Handle Errors (OTP expired - 410, or Incorrect OTP)
                    String errorMsg = e.response?.data['message'] ?? "Verification Failed";
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(errorMsg), backgroundColor: Colors.redAccent),
                    );
                  }
                },
                    style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFBD93F9),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                  ),
                  child: const Text(
                    "VERIFY & CONTINUE",
                    style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildOtpField(int index) {
    return Container(
      width: 45,
      height: 55,
      decoration: BoxDecoration(
        color: const Color(0xFF1B1464).withOpacity(0.3),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFBD93F9).withOpacity(0.2)),
      ),
      child: TextField(
        controller: _controllers[index],
        autofocus: index == 0,
        textAlign: TextAlign.center,
        keyboardType: TextInputType.number,
        maxLength: 1,
        style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
        decoration: const InputDecoration(
          counterText: "",
          border: InputBorder.none,
        ),
        onChanged: (value) {
          if (value.isNotEmpty && index < 5) {
            FocusScope.of(context).nextFocus();
          } else if (value.isEmpty && index > 0) {
            FocusScope.of(context).previousFocus();
          }
        },
      ),
    );
  }
}