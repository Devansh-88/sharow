import 'dart:io';
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'display_picturescreen.dart'; // Ensure this filename matches exactly

class ScannerScreen extends StatefulWidget {
  const ScannerScreen({super.key});

  @override
  State<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends State<ScannerScreen> {
  CameraController? _controller;
  List<CameraDescription>? _cameras;
  bool _isInitializing = true;

  @override
  void initState() {
    super.initState();
    _initializeCamera();
  }

  Future<void> _initializeCamera() async {
    try {
      _cameras = await availableCameras();
      if (_cameras != null && _cameras!.isNotEmpty) {
        _controller = CameraController(
          _cameras![0],
          ResolutionPreset.medium, // Stable resolution for AI scanning
          enableAudio: false,
        );

        await _controller!.initialize();
      }
    } catch (e) {
      print("Camera Initialization Error: $e");
    } finally {
      if (mounted) {
        setState(() {
          _isInitializing = false;
        });
      }
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Show loading while camera is starting
    if (_isInitializing || _controller == null || !_controller!.value.isInitialized) {
      return const Scaffold(
        backgroundColor: Color(0xFF0D0221),
        body: Center(child: CircularProgressIndicator(color: Color(0xFFBD93F9))),
      );
    }

    return Scaffold(
      body: Stack(
        children: [
          // 1. Live Camera Feed
          Positioned.fill(child: CameraPreview(_controller!)),

          // 2. The Visual Scanner Overlay
          _buildOverlay(context),

          // 3. UI Controls
          Positioned(
            bottom: 50,
            left: 0,
            right: 0,
            child: Column(
              children: [
                const Text(
                  "Align bill within the frame",
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    shadows: [Shadow(blurRadius: 10, color: Colors.black)],
                  ),
                ),
                const SizedBox(height: 20),
                
                // --- THE SHUTTER BUTTON ---
                GestureDetector(
                  onTap: () async {
                    if (_controller!.value.isTakingPicture) return;

                    try {
                      // Capture the photo
                      final XFile image = await _controller!.takePicture();

                      if (!mounted) return;

                      // Move to the Preview Screen
                      await Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => DisplayPictureScreen(imagePath: image.path),
                        ),
                      );
                    } catch (e) {
                      print("❌ Capture Error: $e");
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text("Error: $e")),
                      );
                    }
                  },
                  child: Container(
                    height: 85,
                    width: 85,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: const Color(0xFFBD93F9), width: 6),
                      color: Colors.white.withOpacity(0.2),
                    ),
                    child: const Icon(Icons.camera_alt, color: Colors.white, size: 40),
                  ),
                ),
              ],
            ),
          ),

          // 4. Back Button
          Positioned(
            top: 50,
            left: 20,
            child: IconButton(
              icon: const Icon(Icons.arrow_back_ios, color: Colors.white),
              onPressed: () => Navigator.pop(context),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOverlay(BuildContext context) {
    return Container(
      decoration: ShapeDecoration(
        shape: _ScannerOverlayShape(
          borderColor: const Color(0xFFBD93F9),
          borderWidth: 3.0,
          overlayColor: Colors.black.withOpacity(0.5),
        ),
      ),
    );
  }
}

// --- Custom Overlay Painter (No changes here, it works great) ---
class _ScannerOverlayShape extends ShapeBorder {
  final Color borderColor;
  final double borderWidth;
  final Color overlayColor;

  const _ScannerOverlayShape({
    required this.borderColor,
    required this.borderWidth,
    required this.overlayColor,
  });

  @override
  EdgeInsetsGeometry get dimensions => const EdgeInsets.all(10);
  @override
  Path getInnerPath(Rect rect, {TextDirection? textDirection}) => Path();
  @override
  Path getOuterPath(Rect rect, {TextDirection? textDirection}) => Path()..addRect(rect);

  @override
  void paint(Canvas canvas, Rect rect, {TextDirection? textDirection}) {
    final width = rect.width;
    final height = rect.height;
    final boxWidth = width * 0.8;
    final boxHeight = height * 0.5;

    final backgroundPaint = Paint()..color = overlayColor;
    final boxRect = Rect.fromCenter(
      center: Offset(width / 2, height / 2),
      width: boxWidth,
      height: boxHeight,
    );

    canvas.drawPath(
      Path.combine(
        PathOperation.difference,
        Path()..addRect(rect),
        Path()..addRRect(RRect.fromRectAndRadius(boxRect, const Radius.circular(20))),
      ),
      backgroundPaint,
    );

    final borderPaint = Paint()
      ..color = borderColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = borderWidth;
    
    canvas.drawRRect(RRect.fromRectAndRadius(boxRect, const Radius.circular(20)), borderPaint);
  }

  @override
  ShapeBorder scale(double t) => this;
}