import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

class SplineRoomVisualizer extends StatefulWidget {
  const SplineRoomVisualizer({super.key});

  @override
  State<SplineRoomVisualizer> createState() => _SplineRoomVisualizerState();
}

class _SplineRoomVisualizerState extends State<SplineRoomVisualizer> {
  late final WebViewController controller;
  bool isLoaded = false;

  @override
  void initState() {
    super.initState();
    controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFF0D0221))
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageFinished: (String url) {
            // INJECT CSS: Hides the Spline logo and prevents the "bounce" effect
            controller.runJavaScript("""
              var style = document.createElement('style');
              style.innerHTML = '#logo { display: none !important; } body { overflow: hidden !important; touch-action: none; }';
              document.head.appendChild(style);
            """);
            
            if (mounted) {
              setState(() {
                isLoaded = true;
              });
            }
          },
        ),
      )
      ..loadRequest(
        Uri.parse('https://my.spline.design/untitled-Rw7G4mWlNXLW4Zysi5OY4ZgJ/'), 
      );
  }

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      // Optional: Add rounded corners to make it fit your UI design
      borderRadius: BorderRadius.circular(20),
      child: Stack(
        children: [
          // 1. The 3D Scene
          WebViewWidget(controller: controller),

          // 2. The Loading Overlay
          if (!isLoaded)
            Container(
              color: const Color(0xFF0D0221),
              child: const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CircularProgressIndicator(color: Color(0xFFBD93F9)),
                    SizedBox(height: 15),
                    Text(
                      "INITIALIZING ROOM",
                      style: TextStyle(
                        color: Color(0xFFBD93F9), 
                        fontSize: 10, 
                        letterSpacing: 2,
                        fontWeight: FontWeight.bold
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}