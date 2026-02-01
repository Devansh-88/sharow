import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shadowapp/providers/energy_provider.dart';
import 'package:shadowapp/providers/user_provider.dart';
import 'package:shadowapp/screens/home_dashboard.dart';
import 'package:shadowapp/screens/login_screen.dart';
import 'package:shadowapp/screens/otp_verification_screen.dart';
import 'package:shadowapp/screens/registration_screen.dart';
import 'package:shadowapp/screens/splash_screen.dart';
import 'package:shadowapp/services/api_client.dart'; // 1. Import your login screen

void main() async{
  WidgetsFlutterBinding.ensureInitialized();

  await ApiClient.init();

  // 3. Initialize UserProvider and Load Data from Disk
  final userProvider = UserProvider();
  await userProvider.loadUser(); // This prevents the "flash" of Guest UI

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => EnergyProvider()),
        ChangeNotifierProvider.value(value: userProvider),
      ],
      child: const MyApp(), 
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Shadow App',
      theme: ThemeData(
        brightness: Brightness.dark,
        primaryColor: const Color(0xFFBD93F9),
      ),
      // CHANGE 1: Use initialRoute instead of home
      initialRoute: '/splash_screen', 
      
      // CHANGE 2: Ensure all your route keys are consistent
      routes: {
        '/otp_screen': (context) => const OtpVerificationScreen(),
        '/splash_screen': (context) => const SplashScreen(),
        '/login_screen': (context) => const LoginScreen(),
        '/registration_screen': (context) => const RegisterScreen(),
        '/home_dashboard': (context) => const HomeDashboard(),
      },
    );
  }
}