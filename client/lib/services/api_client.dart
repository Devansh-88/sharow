import 'package:dio/dio.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import 'package:cookie_jar/cookie_jar.dart';
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'dart:io';

class ApiClient {
  static const String baseUrl = 'http://10.81.96.157/api'; 
  static late PersistCookieJar cookieJar; // Store this for manual clears (logout)

  static final Dio _dio = Dio(
    BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 30), 
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ),
  );

  static Dio get instance => _dio;

  // IMPORTANT: Call this in your main.dart before making any requests
  static Future<void> init() async {
    // 1. Get the directory to store the cookie file
    Directory appDocDir = await getApplicationDocumentsDirectory();
    String appDocPath = appDocDir.path;

    // 2. Initialize the PersistCookieJar
    cookieJar = PersistCookieJar(
      storage: FileStorage("$appDocPath/.cookies/"),
      ignoreExpires: false, // Set to true if your backend sends invalid expiry
    );

    // 3. Add the CookieManager interceptor to Dio
    _dio.interceptors.add(CookieManager(cookieJar));
    
    // Add your other interceptors (logging, etc.)
    setupInterceptors();
  }

  static void setupInterceptors() {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        // Attach Bearer token if available
        final prefs = await SharedPreferences.getInstance();
        final userData = prefs.getString('user_data');
        if (userData != null) {
          final userMap = jsonDecode(userData);
          final token = userMap['accessToken'];
          if (token != null && token is String && token.isNotEmpty) {
            options.headers['authorization'] = 'Bearer $token';
          }
        }
        handler.next(options);
      },
      onResponse: (response, handler) => handler.next(response),
      onError: (DioException e, handler) => handler.next(e),
    ));
  }
}