export const STATES_DISTRICTS = {
  "Kerala": [
    "Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha", "Kottayam",
    "Idukki", "Ernakulam", "Thrissur", "Palakkad", "Malappuram",
    "Kozhikode", "Wayanad", "Kannur", "Kasaragod"
  ],
  "Tamil Nadu": [
    "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore",
    "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kancheepuram",
    "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai",
    "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai",
    "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi",
    "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli",
    "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur",
    "Vellore", "Viluppuram", "Virudhunagar"
  ]
};

// Approximate district centers for map centering
export const DISTRICT_CENTERS = {
  // Kerala
  "Thiruvananthapuram": [8.5241, 76.9366],
  "Kollam": [8.8932, 76.6141],
  "Pathanamthitta": [9.2648, 76.7870],
  "Alappuzha": [9.4981, 76.3388],
  "Kottayam": [9.5916, 76.5222],
  "Idukki": [10.0889, 77.0595],
  "Ernakulam": [9.9816, 76.2999],
  "Thrissur": [10.5276, 76.2144],
  "Palakkad": [10.7867, 76.6548],
  "Malappuram": [11.0510, 76.0711],
  "Kozhikode": [11.2588, 75.7804],
  "Wayanad": [11.6083, 76.0838],
  "Kannur": [11.8745, 75.3704],
  "Kasaragod": [12.4996, 74.9869],
  // Tamil Nadu
  "Ariyalur": [11.1401, 79.0787],
  "Chengalpattu": [12.6819, 79.9880],
  "Chennai": [13.0827, 80.2707],
  "Coimbatore": [11.0168, 76.9558],
  "Cuddalore": [11.7480, 79.7714],
  "Dharmapuri": [12.1211, 78.1583],
  "Dindigul": [10.3624, 77.9695],
  "Erode": [11.3410, 77.7172],
  "Kallakurichi": [11.7402, 78.9629],
  "Kancheepuram": [12.8342, 79.7036],
  "Kanyakumari": [8.0883, 77.5385],
  "Karur": [10.9601, 78.0766],
  "Krishnagiri": [12.5186, 78.2137],
  "Madurai": [9.9252, 78.1198],
  "Mayiladuthurai": [11.1027, 79.6524],
  "Nagapattinam": [10.7656, 79.8449],
  "Namakkal": [11.2189, 78.1677],
  "Nilgiris": [11.4102, 76.6950],
  "Perambalur": [11.2342, 78.8807],
  "Pudukkottai": [10.3833, 78.8001],
  "Ramanathapuram": [9.3639, 78.8395],
  "Ranipet": [12.9245, 79.3308],
  "Salem": [11.6643, 78.1460],
  "Sivaganga": [9.8479, 78.4836],
  "Tenkasi": [8.9591, 77.3152],
  "Thanjavur": [10.7870, 79.1378],
  "Theni": [10.0104, 77.4820],
  "Thoothukudi": [8.7642, 78.1348],
  "Tiruchirappalli": [10.7905, 78.7047],
  "Tirunelveli": [8.7139, 77.7567],
  "Tirupathur": [12.4966, 78.5710],
  "Tiruppur": [11.1085, 77.3411],
  "Tiruvallur": [13.1439, 79.9091],
  "Tiruvannamalai": [12.2253, 79.0747],
  "Tiruvarur": [10.7726, 79.6368],
  "Vellore": [12.9165, 79.1325],
  "Viluppuram": [11.9401, 79.4861],
  "Virudhunagar": [9.5810, 77.9624],
};

export const getDistrictCenter = (district) => DISTRICT_CENTERS[district] || [11.0, 78.0];
