import 'package:flutter/material.dart';
import 'package:spline_viewer/spline_viewer.dart' as native; // Use 'native' to avoid naming clashes

class SplineViewerScreen extends StatefulWidget {
  const SplineViewerScreen({super.key});

  @override
  State<SplineViewerScreen> createState() => _SplineViewerScreenState();
}

class _SplineViewerScreenState extends State<SplineViewerScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D0221),
      body: Center(
        child: native.SplineViewer(
          // CRITICAL FIX: Changed from 'my.spline.design' to the 'prod' scene.splinecode link
          splineViewerUrl: 'https://prod.spline.design/Rw7G4mWlNXLW4Zysi5OY4ZgJ/scene.splinecode',
          
          // This allows the native renderer to download the Spline engine
          moduleUrl: 'https://unpkg.com/@splinetool/viewer@1.0.28/build/spline-viewer.js',
        ),
      ),
    );
  }
}