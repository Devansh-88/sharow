import 'package:flutter/material.dart';

class AppLogo extends StatelessWidget {
  final double size;
  final bool showText;

  const AppLogo({
    super.key, 
    this.size = 100, 
    this.showText = true
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Stack(
          alignment: Alignment.center,
          children: [
            // The "Vampire Shadow" Glow
            Container(
              width: size * 0.8,
              height: size * 0.8,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFFBD93F9).withOpacity(0.2),
                    blurRadius: size / 2,
                    spreadRadius: 5,
                  ),
                ],
              ),
            ),
            // The Minimalist Vampire Icon (Customized)
            Icon(
              Icons.vignette_rounded, // Gives that sharp, angular look
              color: const Color(0xFFBD93F9),
              size: size,
            ),
            // The "Fangs" using a custom Icon
            Positioned(
              bottom: size * 0.2,
              child: const Row(
                children: [
                  Icon(Icons.keyboard_arrow_down, color: Colors.white, size: 18),
                  SizedBox(width: 8),
                  Icon(Icons.keyboard_arrow_down, color: Colors.white, size: 18),
                ],
              ),
            ),
          ],
        ),
        if (showText) ...[
          const SizedBox(height: 20),
          Text(
            "SHADOW",
            style: TextStyle(
              color: Colors.white,
              fontSize: size * 0.3,
              fontWeight: FontWeight.w900,
              letterSpacing: 8,
            ),
          ),
        ]
      ],
    );
  }
}