import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:shadowapp/models/user_model.dart';

class UserProvider with ChangeNotifier {
  UserModel? _user;

  UserModel? get user => _user;

  // 1. User data set karna (Login/Verify ke baad)
  // Update the signature to accept 'String token' as well
Future<void> setUser(Map<String, dynamic> userData, String token) async {
  // Pass the token into the fromJson factory (using the updated model logic)
  _user = UserModel.fromJson(userData, token: token);
  
  // Save everything to Local Storage
  SharedPreferences prefs = await SharedPreferences.getInstance();
  await prefs.setString('user_data', jsonEncode(_user!.toJson()));
  
  notifyListeners();
}
  // 2. App start hote hi data load karna
  Future<void> loadUser() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    String? userData = prefs.getString('user_data');
    
    if (userData != null) {
      _user = UserModel.fromJson(jsonDecode(userData));
      notifyListeners();
    }
  }

  // 3. Logout
  Future<void> logout() async {
    _user = null;
    SharedPreferences prefs = await SharedPreferences.getInstance();
    await prefs.remove('user_data');
    notifyListeners();
  }
}