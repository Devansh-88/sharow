class UserModel {
  final String id;
  final String name;
  final String email;
  final String? accessToken;

  UserModel({
    required this.id, 
    required this.name, 
    required this.email,
    this.accessToken,});

  // Backend JSON ko model mein convert karne ke liye
  factory UserModel.fromJson(Map<String, dynamic> json, {String? token}) {
  return UserModel(
    id: json['_id'] ?? '',
    name: json['name'] ?? '',
    email: json['email'] ?? '',
    // If we pass a token manually (from OTP), use it. 
    // Otherwise, look for it in the JSON (when loading from disk).
    accessToken: token ?? json['accessToken'], 
  );
}

  // Model ko JSON mein convert karne ke liye (Persistence ke liye)
  Map<String, dynamic> toJson() => {
    '_id': id,
    'name': name,
    'email': email,
    'accessToken': accessToken,
  };
}