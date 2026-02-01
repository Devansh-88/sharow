import 'package:flutter/material.dart';
import 'package:shadowapp/screens/otp_verification_screen.dart';
import 'package:shadowapp/services/api_client.dart';
class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}


class _RegisterScreenState extends State<RegisterScreen> {
  final _userController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  // --- INSIDE _RegisterScreenState CLASS ---
Future<void> handleSignUp(BuildContext context) async {
  // Show Loading Dialog
  showDialog(
    context: context,
    barrierDismissible: false,
    builder: (context) => const Center(child: CircularProgressIndicator(color: Color(0xFFBD93F9))),
  );
  Navigator.pop(context);
  // 5. Navigate to OTP
  Navigator.push(
    context,
    MaterialPageRoute(
      builder: (context) => const OtpVerificationScreen(),
    ),
  );

  
  try {
    final response = await ApiClient.instance.post(
      '/auth/signup',
      data: {
        'username': _userController.text.trim(),
        'email': _emailController.text.trim(),
        'password': _passwordController.text.trim(),
      },
    );

    Navigator.pop(context); // Close Loading Dialog

    if (response.statusCode == 201 || response.statusCode == 200) {
      Navigator.pop(context); // Close loading dialog

      // Navigate to OTP Screen
      Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => const OtpVerificationScreen()),
      );

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Code sent! Please verify.")),
      );
    }
  } catch (e) {
    Navigator.pop(context); // Close Loading Dialog
    print("DEBUG ERROR: $e");
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text("Error: ${e.toString()}")),
    );
  }

  
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
          padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text("Create Account", 
                style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold)),
              const SizedBox(height: 10),
              Text("Join us to start managing your bills", 
                style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 16)),
              
              const SizedBox(height: 40),

              // 1. Username
              _buildTextField(
                controller: _userController,
                label: "Username",
                icon: Icons.person_outline,
              ),
              const SizedBox(height: 20),

              // 2. Email
              _buildTextField(
                controller: _emailController,
                label: "Email Address",
                icon: Icons.email_outlined,
              ),
              const SizedBox(height: 20),

              // 3. Password
              _buildTextField(
                controller: _passwordController,
                label: "Password",
                icon: Icons.lock_outline,
                isPassword: true,
              ),
              const SizedBox(height: 20),

              // 4. Confirm Password
              _buildTextField(
                controller: _confirmPasswordController,
                label: "Confirm Password",
                icon: Icons.lock_reset_outlined,
                isPassword: true,
              ),

              const SizedBox(height: 40),

              // Sign Up Button
              SizedBox(
                width: double.infinity,
                height: 55,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFBD93F9),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                  ),
                  onPressed: () {
                  // 1. Basic validation check
                  if (_passwordController.text != _confirmPasswordController.text) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text("Passwords do not match!")),
                    );
                    return;
                  }
                  
                  // 2. Call the logic
                  handleSignUp(context); 
                },
                  child: const Text("SIGN UP", 
                    style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 16)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    bool isPassword = false,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Colors.white70, fontSize: 14)),
        const SizedBox(height: 10),
        TextField(
          controller: controller,
          obscureText: isPassword,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            prefixIcon: Icon(icon, color: const Color(0xFFBD93F9)),
            filled: true,
            fillColor: Colors.white.withOpacity(0.05),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(15),
              borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(15),
              borderSide: const BorderSide(color: Color(0xFFBD93F9)),
            ),
          ),
        ),
      ],
    );
  }
}