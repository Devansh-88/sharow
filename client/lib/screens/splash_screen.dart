import 'dart:async';
import 'package:flutter/material.dart';
import 'package:shadowapp/widgets/app_logo.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  static const double _scale = 0.8;
  @override
  void initState() {
    super.initState();
    Timer(const Duration(seconds: 3), () {
      
      Navigator.pushReplacementNamed(context, '/login_screen');
    });
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: Color(0xFF0D0221),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Your Logo or App Icon
            Center(
              child: AnimatedScale(
                scale: _scale,
                duration: const Duration(seconds: 2),
                curve: Curves.elasticOut,
                child: const AppLogo(size: 120), // Just call it like this!
              ),
            ),
           
          ],
        ),
      ),
    );
  }
}