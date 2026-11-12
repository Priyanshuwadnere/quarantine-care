import { Patient, HistoricalClosedCase } from '../types/patient';
import { Bed } from '../types/bed';
import { WaitlistPatient, FacilitySettings } from '../types/workflow';
import { User } from '../types/user';
import { TemperatureReading } from '../types/temperature';

export const FACILITY_BASE_DATE = '2026-11-12';

export const DEMO_USERS: User[] = [
  {
    id: 'u-nurse',
    username: 'nurse',
    name: 'Nurse Sunita Rao',
    role: 'nurse',
    title: 'Senior Duty Nurse',
    avatarColor: 'bg-teal-600',
  },
  {
    id: 'u-doctor',
    username: 'doctor',
    name: 'Dr. Arjun Mehta',
    role: 'doctor',
    title: 'Attending Physician',
    avatarColor: 'bg-blue-600',
  },
  {
    id: 'u-admin',
    username: 'admin',
    name: 'Pooja Deshmukh',
    role: 'admin',
    title: 'Quarantine Administrator',
    avatarColor: 'bg-purple-600',
  },
  {
    id: 'u-head',
    username: 'head',
    name: 'Dr. Vikramaditya Sen',
    role: 'head_doctor',
    title: 'Chief Medical Officer / Head Doctor',
    avatarColor: 'bg-indigo-700',
  },
];

export const DEFAULT_SETTINGS: FacilitySettings = {
  feverThreshold: 38.0,
  mortalityAlertLimit: 15.0,
  facilityCapacity: 74,
  alertMinCases: 20,
};

// 74 Realistic Indian Names
const INDIAN_NAMES: { name: string; age: number; gender: 'Male' | 'Female' | 'Other' }[] = [
  { name: 'Ramesh Patel', age: 48, gender: 'Male' }, // B-01: Fever today (38.8°C)
  { name: 'Sneha Nair', age: 34, gender: 'Female' }, // B-02: Existing reading today (Duplicate test)
  { name: 'Aarav Verma', age: 29, gender: 'Male' }, // B-03: Done today, normal
  { name: 'Amitav Mukherjee', age: 52, gender: 'Male' }, // B-04: 2 fever-free days, Pending today
  { name: 'Rahul Deshmukh', age: 41, gender: 'Male' }, // B-05: No reading today (Doctor test)
  { name: 'Ananya Sharma', age: 26, gender: 'Female' }, // B-06: Done today, normal
  { name: 'Deepak Joshi', age: 60, gender: 'Male' }, // B-07: Done today, normal
  { name: 'Sunita Joshi', age: 38, gender: 'Female' }, // B-08: 3 fever-free days completed, eligible!
  { name: 'Kavita Iyer', age: 45, gender: 'Female' }, // B-09: Done today, normal
  { name: 'Vijay Chawla', age: 55, gender: 'Male' }, // B-10: Pending today
  { name: 'Pooja Hegde', age: 31, gender: 'Female' }, // B-11: Done today
  { name: 'Vikram Malhotra', age: 64, gender: 'Male' }, // B-12: Confirmed discharge awaiting Admin
  { name: 'Preeti Singhania', age: 28, gender: 'Female' }, // B-13: Pending today
  { name: 'Sanjay Dutt', age: 58, gender: 'Male' }, // B-14: Done today
  { name: 'Meera Sen', age: 71, gender: 'Female' }, // B-15: Confirmed discharge OVERDUE (>2 hrs)
  { name: 'Manish Pandey', age: 39, gender: 'Male' }, // B-16: Pending today
  { name: 'Geeta Balan', age: 49, gender: 'Female' }, // B-17: Done today
  { name: 'Harish Reddy', age: 53, gender: 'Male' }, // B-18: Pending today
  { name: 'Shreya Ghoshal', age: 33, gender: 'Female' }, // B-19: Done today
  { name: 'Arvind Kulkarni', age: 76, gender: 'Male' }, // B-20: Deceased awaiting bed release
  { name: 'Naveen Kumar', age: 44, gender: 'Male' }, // B-21: Pending
  { name: 'Lakshmi Narayan', age: 62, gender: 'Female' }, // B-22: Done
  { name: 'Gautam Gambhir', age: 42, gender: 'Male' }, // B-23: Pending
  { name: 'Swati Pillai', age: 37, gender: 'Female' }, // B-24: Done
  { name: 'Karan Mehra', age: 30, gender: 'Male' }, // B-25: Pending
  { name: 'Divya Aggarwal', age: 25, gender: 'Female' }, // B-26: Done
  { name: 'Alok Nath', age: 67, gender: 'Male' }, // B-27: Pending
  { name: 'Ritu Varma', age: 43, gender: 'Female' }, // B-28: Done
  { name: 'Tarun Mansukhani', age: 50, gender: 'Male' }, // B-29: Pending
  { name: 'Neelam Kothari', age: 56, gender: 'Female' }, // B-30: Done
  { name: 'Ashok Saxena', age: 63, gender: 'Male' }, // B-31: Pending
  { name: 'Usha Uthup', age: 69, gender: 'Female' }, // B-32: Done
  { name: 'Chetan Bhagat', age: 47, gender: 'Male' }, // B-33: Pending
  { name: 'Tanvi Azmi', age: 54, gender: 'Female' }, // B-34: Done
  { name: 'Nikhil Advani', age: 36, gender: 'Male' }, // B-35: Pending
  { name: 'Bhavna Pandey', age: 40, gender: 'Female' }, // B-36: Done
  { name: 'Praveen Tambe', age: 51, gender: 'Male' }, // B-37: Pending
  { name: 'Madhuri Dixit', age: 57, gender: 'Female' }, // B-38: Done
  { name: 'Sachin Tendulkar', age: 50, gender: 'Male' }, // B-39: Pending
  { name: 'Anjali Sharma', age: 46, gender: 'Female' }, // B-40: Done
  { name: 'Sourav Ganguly', age: 51, gender: 'Male' }, // B-41: Pending
  { name: 'Mithali Raj', age: 39, gender: 'Female' }, // B-42: Done
  { name: 'Virender Sehwag', age: 45, gender: 'Male' }, // B-43: Pending
  { name: 'Jhulan Goswami', age: 41, gender: 'Female' }, // B-44: Done
  { name: 'Yuvraj Singh', age: 42, gender: 'Male' }, // B-45: Pending
  { name: 'Harmanpreet Kaur', age: 35, gender: 'Female' }, // B-46: Done
  { name: 'Zaheer Khan', age: 46, gender: 'Male' }, // B-47: Pending
  { name: 'Smriti Mandhana', age: 28, gender: 'Female' }, // B-48: Done
  { name: 'Anil Kumble', age: 53, gender: 'Male' }, // B-49: Pending
  { name: 'Jemimah Rodrigues', age: 24, gender: 'Female' }, // B-50: Done
  { name: 'Javagal Srinath', age: 55, gender: 'Male' }, // B-51: Pending
  { name: 'Deepti Sharma', age: 27, gender: 'Female' }, // B-52: Done
  { name: 'Venkatesh Prasad', age: 54, gender: 'Male' }, // B-53: Pending
  { name: 'Shafali Verma', age: 20, gender: 'Female' }, // B-54: Done
  { name: 'Robin Uthappa', age: 38, gender: 'Male' }, // B-55: Pending
  { name: 'Poonam Yadav', age: 32, gender: 'Female' }, // B-56: Done
  { name: 'Dinesh Karthik', age: 39, gender: 'Male' }, // B-57: Pending
  { name: 'Ekta Bisht', age: 37, gender: 'Female' }, // B-58: Done
  { name: 'Ajit Agarkar', age: 46, gender: 'Male' }, // B-59: Pending
  { name: 'Radha Yadav', age: 24, gender: 'Female' }, // B-60: Done
  { name: 'Irfan Pathan', age: 40, gender: 'Male' }, // B-61: Pending
  { name: 'Veda Krishnamurthy', age: 32, gender: 'Female' }, // B-62: Done
  { name: 'Yusuf Pathan', age: 42, gender: 'Male' }, // B-63: Pending
  { name: 'Sushma Verma', age: 31, gender: 'Female' }, // B-64: Done
  { name: 'Suresh Raina', age: 38, gender: 'Male' }, // B-65: Pending
  { name: 'Mansi Joshi', age: 31, gender: 'Female' }, // B-66: Done
  { name: 'Ambati Rayudu', age: 39, gender: 'Male' }, // B-67: Pending
  { name: 'Shikha Pandey', age: 35, gender: 'Female' }, // B-68: Done
  { name: 'Kedar Jadhav', age: 39, gender: 'Male' }, // B-69: Pending
  { name: 'Pooja Vastrakar', age: 25, gender: 'Female' }, // B-70: Done
  { name: 'Murali Vijay', age: 40, gender: 'Male' }, // B-71: Pending
  { name: 'Richa Ghosh', age: 21, gender: 'Female' }, // B-72: Done
  { name: 'Cheteshwar Pujara', age: 36, gender: 'Male' }, // B-73: Pending
  { name: 'Harleen Deol', age: 26, gender: 'Female' }, // B-74: Done
];

export function generateSeedData(): {
  patients: Patient[];
  beds: Bed[];
  waitlist: WaitlistPatient[];
  historicalClosedCases: HistoricalClosedCase[];
} {
  const currentDate = FACILITY_BASE_DATE; // '2026-11-12'

  // 1. Generate 74 Beds
  const beds: Bed[] = [];
  for (let i = 1; i <= 74; i++) {
    const bedId = `B-${String(i).padStart(2, '0')}`;
    let status: Bed['status'] = 'occupied';
    if (bedId === 'B-12') status = 'pending_release';
    if (bedId === 'B-15') status = 'pending_release';
    if (bedId === 'B-20') status = 'deceased_awaiting_release';

    beds.push({
      id: bedId,
      bedNumber: i,
      status,
      currentPatientId: `PT-${1000 + i}`,
      patientName: INDIAN_NAMES[i - 1].name,
      updatedAt: '2026-11-12T08:00:00Z',
    });
  }

  // 2. Generate 74 Admitted Patients
  const patients: Patient[] = INDIAN_NAMES.map((info, idx) => {
    const bedNum = idx + 1;
    const bedId = `B-${String(bedNum).padStart(2, '0')}`;
    const patientId = `PT-${1000 + bedNum}`;

    // Admission dates between 2026-11-06 and 2026-11-11
    const daysPrior = (idx % 6) + 1; // 1 to 6 days
    const admissionDate = `2026-11-${String(12 - daysPrior).padStart(2, '0')}`;
    const admissionTime = `${admissionDate}T10:00:00Z`;

    const temperatureHistory: TemperatureReading[] = [];

    // Populate past temperature history from admissionDate to yesterday (2026-11-11)
    for (let d = 12 - daysPrior; d <= 11; d++) {
      const pastDate = `2026-11-${String(d).padStart(2, '0')}`;
      // By default normal temp around 36.6 - 37.2, unless early fever
      let temp = 36.7 + ((idx + d) % 6) * 0.1;

      // Ensure patient B-08 has 3 consecutive fever-free past days (2026-11-09, 10, 11)
      if (bedId === 'B-08') {
        temp = 36.6;
      }
      // Ensure patient B-04 has 2 consecutive fever-free past days (2026-11-10, 11)
      if (bedId === 'B-04') {
        if (d >= 10) temp = 36.8;
        else temp = 38.5; // fever earlier
      }

      temperatureHistory.push({
        id: `TR-${patientId}-${pastDate}`,
        patientId,
        temperature: parseFloat(temp.toFixed(1)),
        recordedAt: `${pastDate}T09:30:00Z`,
        facilityDate: pastDate,
        recordedBy: 'nurse',
        recorderRole: 'nurse',
        isFever: temp >= 38.0,
      });
    }

    // Now handle Today (2026-11-12)
    // Pending patients: at least 25 patients. Let's make odd indexes >= 21 pending, plus B-04, B-05, B-10, B-13, B-16, B-18 (total ~30 pending)
    const isPendingToday =
      bedId === 'B-04' ||
      bedId === 'B-05' ||
      bedId === 'B-10' ||
      bedId === 'B-13' ||
      bedId === 'B-16' ||
      bedId === 'B-18' ||
      (bedNum >= 21 && bedNum % 2 === 1);

    if (!isPendingToday) {
      // Done today
      let todayTemp = 36.8;
      if (bedId === 'B-01') {
        todayTemp = 38.8; // Special Scenario 4: Fever today!
      } else if (bedId === 'B-02') {
        todayTemp = 37.1; // Special Scenario 2: Existing reading for duplicate test
      }

      temperatureHistory.push({
        id: `TR-${patientId}-${currentDate}`,
        patientId,
        temperature: todayTemp,
        recordedAt: `${currentDate}T08:30:00Z`,
        facilityDate: currentDate,
        recordedBy: 'nurse',
        recorderRole: 'nurse',
        isFever: todayTemp >= 38.0,
      });
    }

    // Status setup
    let status: Patient['status'] = 'admitted';
    let dischargeConfirmation = undefined;
    let deathRecord = undefined;
    let bedReleaseStatus: Patient['bedReleaseStatus'] = 'not_needed';

    // Scenario 5: B-08 is Eligible (3 past fever-free days: Nov 9, 10, 11)
    if (bedId === 'B-08') {
      status = 'discharge_eligible';
    }

    // Scenario 6: B-12 confirmed discharge awaiting Admin processing (< 2 hrs ago)
    if (bedId === 'B-12') {
      status = 'discharge_confirmed';
      dischargeConfirmation = {
        doctorId: 'u-doctor',
        doctorName: 'Dr. Arjun Mehta',
        confirmedAt: `${currentDate}T11:45:00Z`, // 45 mins ago relative to 12:30
      };
      bedReleaseStatus = 'pending';
    }

    // Scenario 7: B-15 confirmed discharge OVERDUE (> 2 hrs ago)
    if (bedId === 'B-15') {
      status = 'discharge_confirmed';
      dischargeConfirmation = {
        doctorId: 'u-doctor',
        doctorName: 'Dr. Arjun Mehta',
        confirmedAt: `${currentDate}T08:30:00Z`, // 4+ hours ago
      };
      bedReleaseStatus = 'pending';
    }

    // Scenario 8: B-20 deceased awaiting bed release
    if (bedId === 'B-20') {
      status = 'deceased';
      deathRecord = {
        doctorId: 'u-doctor',
        doctorName: 'Dr. Arjun Mehta',
        recordedAt: `${currentDate}T07:15:00Z`,
        facilityDate: currentDate,
        confirmed: true,
        notes: 'Sudden acute respiratory failure secondary to viral infection.',
      };
      bedReleaseStatus = 'pending';
    }

    return {
      id: patientId,
      name: info.name,
      age: info.age,
      gender: info.gender,
      bedNumber: bedId,
      admissionDate,
      admissionTime,
      contactNumber: `+91 98${(bedNum * 13579) % 90000000 + 10000000}`,
      status,
      temperatureHistory,
      doctorVisits: [],
      feverFreeDaysCount: bedId === 'B-08' ? 3 : bedId === 'B-04' ? 2 : 1,
      feverFreeDates:
        bedId === 'B-08'
          ? ['2026-11-09', '2026-11-10', '2026-11-11']
          : bedId === 'B-04'
          ? ['2026-11-10', '2026-11-11']
          : ['2026-11-11'],
      dischargeEligibilityDate: bedId === 'B-08' ? '2026-11-12' : undefined,
      dischargeConfirmation,
      deathRecord,
      bedReleaseStatus,
    };
  });

  // 3. Exactly 3 Waitlisted Patients (FIFO)
  const waitlist: WaitlistPatient[] = [
    {
      id: 'WL-01',
      name: 'Devendra Joshi',
      age: 46,
      gender: 'Male',
      contactNumber: '+91 9823412345',
      addedAt: '2026-11-12T07:30:00Z',
      addedDate: '2026-11-12',
      queuePosition: 1,
      notes: 'Referred by district health officer; high fever since 3 days.',
    },
    {
      id: 'WL-02',
      name: 'Kavita Sundaram',
      age: 39,
      gender: 'Female',
      contactNumber: '+91 9834523456',
      addedAt: '2026-11-12T08:15:00Z',
      addedDate: '2026-11-12',
      queuePosition: 2,
      notes: 'Close contact of confirmed case; persistent chills.',
    },
    {
      id: 'WL-03',
      name: 'Rohan Shah',
      age: 27,
      gender: 'Male',
      contactNumber: '+91 9845634567',
      addedAt: '2026-11-12T09:00:00Z',
      addedDate: '2026-11-12',
      queuePosition: 3,
      notes: 'Symptomatic; self-reported for quarantine triage.',
    },
  ];

  // 4. Exactly 40 Historical Closed Cases: 35 Cured, 5 Deceased -> Mortality = 5/40 = 12.5%
  const historicalClosedCases: HistoricalClosedCase[] = [];

  const closedNames = [
    'Rajesh Khanna', 'Sharmila Tagore', 'Dev Anand', 'Waheeda Rehman', 'Dilip Kumar',
    'Madhubala', 'Guru Dutt', 'Meena Kumari', 'Sanjeev Kumar', 'Nutan',
    'Sunil Dutt', 'Nargis', 'Pran', 'Asha Parekh', 'Rajendra Kumar',
    'Sadhana', 'Shammi Kapoor', 'Vyjayanthimala', 'Shashi Kapoor', 'Hema Malini',
    'Jeetendra', 'Mumtaz', 'Dharmendra', 'Rekha', 'Vinod Khanna',
    'Zeenat Aman', 'Rishi Kapoor', 'Neetu Singh', 'Amol Palekar', 'Smita Patil',
    'Naseeruddin Shah', 'Shabana Azmi', 'Om Puri', 'Deepti Naval', 'Farooq Sheikh',
    // 5 Deceased cases
    'Kishore Kumar', 'Mohd Rafi', 'Lata Mangeshkar', 'Mukesh Chand', 'Manna Dey'
  ];

  for (let i = 0; i < 40; i++) {
    const isDeceased = i >= 35; // exactly 5 deceased
    const day = (i % 25) + 1;
    const admissionDate = `2026-10-${String(Math.min(day, 20)).padStart(2, '0')}`;
    const closedDate = `2026-10-${String(Math.min(day + 8, 28)).padStart(2, '0')}`;

    historicalClosedCases.push({
      id: `CC-${2000 + i}`,
      patientId: `HIST-${100 + i}`,
      name: closedNames[i],
      age: 30 + (i * 3) % 45,
      gender: i % 2 === 0 ? 'Male' : 'Female',
      admissionDate,
      closedDate,
      outcome: isDeceased ? 'deceased' : 'cured',
      daysInQuarantine: isDeceased ? 6 : 9,
      finalDoctorName: i % 2 === 0 ? 'Dr. Arjun Mehta' : 'Dr. Vikramaditya Sen',
      notes: isDeceased
        ? 'Refractory fever and multi-organ decompensation.'
        : 'Completed 3 consecutive fever-free days. Fully recovered.',
    });
  }

  return {
    patients,
    beds,
    waitlist,
    historicalClosedCases,
  };
}
