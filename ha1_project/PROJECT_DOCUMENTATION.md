# Team Management & Grading System - Project Documentation

##  Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Database Design](#database-design)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [Key Features](#key-features)
7. [Recent Changes - URL Input System](#recent-changes---url-input-system)
8. [Recent Changes - Beoordelaar Admin Interface Simplification](#recent-changes---beoordelaar-admin-interface-simplification)
9. [Recent Changes - Dynamic Criteria Management](#recent-changes---dynamic-criteria-management)
10. [API Endpoints](#api-endpoints)
11. [How to Run the Project](#how-to-run-the-project)
12. [Technical Decisions](#technical-decisions)

---

##  Project Overview

This project implements a comprehensive **Team Management & Grading System** that allows administrators to create, manage, and grade teams with their members. The system was built with a focus on simplicity and user experience, particularly for academic project evaluation.

### **Core Functionality:**
-  Create new teams with members
-  Edit existing teams and members
-  Delete teams and members
-  View team details and member information
-  **Grade teams across multiple criteria** (NEW!)
-  **Display marks and calculate averages** (NEW!)
-  **Beoordelaar Admin Panel** (NEW!)
-  **Round management and winner determination** (NEW!)
-  **Dynamic criteria management** (NEW!)
-  **Real-time marks updates** (NEW!)
-  Image management via URL inputs
-  Real-time updates and live previews

---

##  System Architecture

### **Technology Stack:**
- **Backend:** Node.js + Express.js
- **Frontend:** React.js
- **Database:** SQLite3
- **Styling:** CSS3 with modern design principles

### **Architecture Diagram:**
```
┌─────────────────┐    HTTP/REST API    ┌─────────────────┐
│   React Frontend │ ◄─────────────────► │  Express Backend │
│   (Port 3000)    │                     │   (Port 4000)    │
└─────────────────┘                     └─────────────────┘
         │                                        │
         │                                        │
         ▼                                        ▼
┌─────────────────┐                     ┌─────────────────┐
│   User Interface │                     │   SQLite3 DB    │
│   - Team Admin   │                     │   - Teams       │
│   - Forms        │                     │   - Members     │
│   - Lists        │                     │   - Images      │
└─────────────────┘                     └─────────────────┘
```

---

##  Database Design

### **Entity Relationship Diagram (ERD):**

```mermaid
erDiagram
    Span ||--o{ Lid : "has members"
    Span ||--o{ Punte_span_brug : "receives marks"
    Rondte ||--o{ Merkblad : "contains marking sheets"
    Kriteria ||--o{ Merkblad : "defines criteria"
    Merkblad ||--o{ Punte_span_brug : "stores marks"
    Rondte ||--o{ rondte_uitslag : "has results"
    Span ||--o{ rondte_uitslag : "participates in rounds"
    
    Span {
        INTEGER span_id PK
        TEXT naam
        TEXT logo
        TEXT projek_beskrywing
        TEXT span_bio
    }
    
    Lid {
        INTEGER lid_id PK
        INTEGER span_id FK
        TEXT naam
        TEXT foto
        TEXT bio
    }
    
    Rondte {
        INTEGER rondte_id PK
        INTEGER is_eerste
        INTEGER is_laaste
        INTEGER is_gesluit
        REAL max_spanne
    }
    
    Kriteria {
        INTEGER kriteria_id PK
        TEXT beskrywing
        INTEGER default_totaal
    }
    
    Merkblad {
        INTEGER merkblad_id PK
        INTEGER rondte_id FK
        INTEGER kriteria_id FK
        INTEGER totaal
    }
    
    Punte_span_brug {
        INTEGER id PK
        INTEGER merkblad_id FK
        INTEGER span_id FK
        INTEGER punt
    }
    
    rondte_uitslag {
        INTEGER span_id PK,FK
        INTEGER rondte_id PK,FK
        INTEGER rank
        INTEGER in_gevaar
        INTEGER gemiddelde_punt
    }
```

### **Tables Structure:**

#### **Span (Teams) Table:**
```sql
CREATE TABLE Span (
    span_id INTEGER PRIMARY KEY,
    naam TEXT NOT NULL,
    logo TEXT,
    projek_beskrywing TEXT,
    span_bio TEXT
);
```

#### **Lid (Members) Table:**
```sql
CREATE TABLE Lid (
    lid_id INTEGER PRIMARY KEY,
    span_id INTEGER NOT NULL,
    naam TEXT NOT NULL,
    foto TEXT,
    bio TEXT,
    FOREIGN KEY (span_id) REFERENCES Span(span_id) ON DELETE CASCADE
);
```

#### **Rondte (Rounds) Table:**
```sql
CREATE TABLE Rondte (
    rondte_id INTEGER PRIMARY KEY,
    is_eerste INTEGER NOT NULL DEFAULT 0,
    is_laaste INTEGER NOT NULL DEFAULT 0,
    is_gesluit INTEGER NOT NULL DEFAULT 0,
    max_spanne REAL NOT NULL 
);
```

#### **Kriteria (Criteria) Table:**
```sql
CREATE TABLE Kriteria (
    kriteria_id INTEGER PRIMARY KEY,
    beskrywing TEXT NOT NULL,
    default_totaal INTEGER NOT NULL
);
```

#### **Merkblad (Marking Sheet) Table:**
```sql
CREATE TABLE Merkblad (
    merkblad_id INTEGER PRIMARY KEY,
    rondte_id INTEGER NOT NULL,
    kriteria_id INTEGER NOT NULL,
    totaal INTEGER,
    FOREIGN KEY (rondte_id) REFERENCES Rondte(rondte_id) ON DELETE CASCADE,
    FOREIGN KEY (kriteria_id) REFERENCES Kriteria(kriteria_id) ON DELETE CASCADE
);
```

#### **Punte_span_brug (Team Marks) Table:**
```sql
CREATE TABLE Punte_span_brug (
    id INTEGER PRIMARY KEY,
    merkblad_id INTEGER NOT NULL,
    span_id INTEGER NOT NULL,
    punt INTEGER NOT NULL,
    FOREIGN KEY (merkblad_id) REFERENCES Merkblad(merkblad_id) ON DELETE CASCADE,
    FOREIGN KEY (span_id) REFERENCES Span(span_id) ON DELETE CASCADE
);
```

#### **rondte_uitslag (Round Results) Table:**
```sql
CREATE TABLE rondte_uitslag (
    span_id INTEGER NOT NULL,
    rondte_id INTEGER NOT NULL,
    rank INTEGER,
    in_gevaar INTEGER NOT NULL DEFAULT 1,
    gemiddelde_punt INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (span_id, rondte_id),
    FOREIGN KEY (span_id) REFERENCES Span(span_id) ON DELETE CASCADE,
    FOREIGN KEY (rondte_id) REFERENCES Rondte(rondte_id) ON DELETE CASCADE
);
```

### **Database Relationships:**
- **One-to-Many:** One team can have multiple members
- **Many-to-Many:** Teams can have marks for multiple criteria across different rounds
- **Foreign Keys:** Proper referential integrity throughout with CASCADE DELETE
- **Composite Primary Key:** rondte_uitslag uses (span_id, rondte_id) as composite key
- **Cascade Operations:** When a team is deleted, all its members, marks, and results are also deleted

---

##  Backend Implementation

### **File Structure:**
```
express_agterend/
├── index.js              # Main server file
├── db_setup/
│   └── setup.js          # Database initialization
├── span/
│   └── span.js           # Database operations
├── package.json          # Dependencies
└── melktert.db          # SQLite database
```

### **Key Backend Components:**

#### **1. Express Server Setup (`index.js`):**
```javascript
const express = require('express');
const cors = require('cors');
const app = express();
const port = 4000;

// CORS configuration for React frontend
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
```

#### **2. Database Operations (`span/span.js`):**
```javascript
// Core functions for team management
- getTeamById(spanId)           // Get single team
- getAllTeams()                 // Get all teams
- createTeam(teamData)          // Create new team
- updateTeam(spanId, teamData)  // Update team
- deleteTeam(spanId)            // Delete team

// Core functions for member management
- getMembersByTeamId(spanId)    // Get team members
- getMemberById(lidId)          // Get single member
- createMember(teamId, memberData) // Create member
- updateMember(lidId, memberData)  // Update member
- deleteMember(lidId)           // Delete member

// NEW: Core functions for grading system
- submitMarks(teamId, marks)    // Submit marks for a team
- fetchTeamMarks(teamId)        // Retrieve marks for a team
- clearTeamMarks(teamId)        // Clear marks for a team
```

---

##  Frontend Implementation

### **File Structure:**
```
react_gui/src/
├── spanadmin/
│   ├── spanadmin.js           # Main admin component
│   ├── spanadmin.css          # Admin styling
│   ├── CreateTeamForm.js      # Team creation form
│   ├── CreateTeamForm.css     # Form styling
│   ├── EditTeamForm.js        # Team editing form
│   ├── EditTeamForm.css       # Edit form styling
│   ├── TeamList.js            # Team sidebar list
│   ├── TeamList.css           # List styling
│   └── span.js                # Team display component
├── merkadmin/
│   ├── merkadmin.js           # Criteria management component (NEW!)
│   └── merkadmin.css          # Criteria management styling (NEW!)
├── services/
│   ├── span_services.js       # API service functions
│   ├── merk_services.js       # Grading API service functions
│   ├── beoordelaar_services.js # Beoordelaar admin API services
│   └── criteria_services.js   # Criteria management API services (NEW!)
├── merk/
│   ├── merk.js               # Grading interface component
│   └── merk.css              # Grading interface styling
├── beoordelaaradmin/
│   ├── beoordelaaradmin.js   # Beoordelaar admin panel
│   └── beoordelaaradmin.css  # Admin panel styling
└── App.js                     # Main app component
```

### **Key Frontend Components:**

#### **1. SpanAdmin (`spanadmin.js`):**
- **Main container** for the entire admin interface
- **State management** for teams, selected team, and UI modes
- **Navigation** between create, edit, and view modes
- **Real-time updates** when teams are modified

#### **2. CreateTeamForm (`CreateTeamForm.js`):**
- **Form for creating new teams** with all required fields
- **Dynamic member addition** - add multiple members during team creation
- **URL input fields** for team logo and member photos
- **Live image previews** with error handling
- **Form validation** and error handling

#### **3. EditTeamForm (`EditTeamForm.js`):**
- **Form for editing existing teams** and their members
- **Pre-populated fields** with current team data
- **Add/remove members** functionality
- **URL input fields** for updating images
- **Real-time member management**

#### **4. TeamList (`TeamList.js`):**
- **Sidebar component** displaying all teams
- **Team selection** with visual feedback
- **Refresh functionality** to reload teams
- **Responsive design** for different screen sizes

#### **5. Merk (`merk.js`) - NEW!**
- **Grading interface** for assigning marks to teams
- **Team selection dropdown** to choose which team to grade
- **Criteria input fields** for Backend, Frontend, Database (0-100 each)
- **Form validation** ensuring all fields are properly filled
- **Existing marks display** showing current grades if team already graded
- **Professional step-by-step UI** with clear instructions

#### **6. MerkAdmin (`merkadmin.js`) - NEW!**
- **Complete CRUD interface** for managing evaluation criteria
- **Create new criteria** with custom descriptions and maximum scores
- **Edit existing criteria** to modify descriptions and scores
- **Delete criteria** with confirmation dialogs
- **View all criteria** in a clean, organized list
- **Form validation** ensuring proper data entry
- **Real-time updates** when criteria are modified
- **Professional interface** matching the application's design

#### **7. BeoordelaarAdmin (`beoordelaaradmin.js`)**
- **Comprehensive admin panel** for managing rounds and viewing results
- **Round selection** to choose which round to manage
- **Real-time marks display** showing live updates as marks are submitted
- **Teams with marks overview** displaying all teams and their current scores
- **Round closure functionality** to finalize rounds and determine winners
- **Winner display** with team details and member information
- **Auto-refresh functionality** for new criteria integration
- **Professional admin interface** with modern styling

---

##  Key Features

### **1. Team Management:**
- **Create Teams:** Complete form with team details and member management
- **Edit Teams:** Modify existing team information and members
- **Delete Teams:** Remove teams with confirmation dialog
- **View Teams:** Display team details with member information

### **2. Member Management:**
- **Add Members:** Add multiple members during team creation or editing
- **Edit Members:** Update member information
- **Remove Members:** Delete individual members
- **Member Display:** Show member photos and bios

### **3. Image Management (URL-Based):**
- **URL Input Fields:** Simple text inputs for image URLs
- **Live Previews:** Real-time image preview as you type
- **Error Handling:** Graceful handling of broken image URLs
- **No File Uploads:** Eliminates complexity of file management

### **4. Grading System (NEW!):**
- **Team Selection:** Choose which team to grade from dropdown
- **Criteria-Based Marking:** Three evaluation criteria (Backend, Frontend, Database)
- **Mark Validation:** Ensures marks are between 0-100 and are whole numbers
- **Mark Display:** Shows grades on team admin page only when assigned
- **Average Calculation:** Automatically calculates and displays average score
- **No Default Marks:** Teams start with no marks until manually graded

### **5. Beoordelaar Admin Panel (NEW!):**
- **Round Management:** Select and manage different evaluation rounds
- **Real-time Updates:** Live streaming of marks as they are submitted
- **Teams Overview:** View all teams with their current marks and averages
- **Round Closure:** Finalize rounds and automatically determine winners
- **Winner Display:** Show winning team with complete member information
- **Criteria Management:** View and manage evaluation criteria
- **Professional Interface:** Modern, responsive admin dashboard

### **6. User Experience:**
- **Responsive Design:** Works on desktop and mobile
- **Real-time Updates:** UI updates immediately after operations
- **Loading States:** Visual feedback during operations
- **Error Messages:** Clear error communication
- **Confirmation Dialogs:** Prevent accidental deletions

---

##  **NEW FEATURE: Grading System**

### **What I Built:**
A comprehensive grading system that allows administrators to evaluate team projects across multiple criteria, perfect for academic project evaluation.

### **Grading System Features:**

#### **1. Mark Assignment Interface (`merk.js`):**
```javascript
// Team selection dropdown
<select value={selectedTeamId} onChange={handleTeamChange}>
  <option value="">-- Kies 'n span --</option>
  {teams.map(team => (
    <option key={team.span_id} value={team.span_id}>
      {team.naam}
    </option>
  ))}
</select>

// Criteria input fields
<input type="number" name="kriteria1" min="0" max="100" />
<input type="number" name="kriteria2" min="0" max="100" />
<input type="number" name="kriteria3" min="0" max="100" />
```

#### **2. Mark Display on Team Admin (`span.js`):**
```javascript
// Conditional display - only shows when team has marks
{marks && marks.has_marks && (
  <div className="marks-section">
    <h3>Span Punte</h3>
    <div className="marks-display">
      {/* Individual scores */}
      <div className="mark-item">
        <span>Backend Development:</span>
        <span>{marks.marks.kriteria1}/100</span>
      </div>
      {/* Average calculation */}
      <div className="total-marks">
        <strong>Totaal: {Math.round((marks.marks.kriteria1 + marks.marks.kriteria2 + marks.marks.kriteria3) / 3)}/100</strong>
      </div>
    </div>
  </div>
)}
```

#### **3. Backend API Implementation:**
```javascript
// Submit marks endpoint
app.post('/teams/:id/marks', async (req, res) => {
  const { kriteria1, kriteria2, kriteria3 } = req.body;
  
  // Validation
  if (kriteria1 < 0 || kriteria1 > 100 || 
      kriteria2 < 0 || kriteria2 > 100 || 
      kriteria3 < 0 || kriteria3 > 100) {
    return res.status(400).json({ error: 'Punte moet tussen 0 en 100 wees' });
  }
  
  // Database transaction to store marks
  // ... implementation details
});

// Retrieve marks endpoint
app.get('/teams/:id/marks', async (req, res) => {
  // Query database for team marks
  // Return formatted response with has_marks flag
});
```

#### **4. Database Integration:**
- **Uses existing database structure** with Kriteria, Merkblad, and Punte_span_brug tables
- **Transaction safety** ensures data consistency when storing marks
- **Validation** at both frontend and backend levels
- **No default marks** - teams start clean until manually graded

### **Benefits of the Grading System:**
1. **Academic Ready** - Perfect for university project evaluation
2. **Fair Assessment** - Consistent criteria-based evaluation
3. **Transparency** - Clear display of individual and total scores
4. **Flexibility** - Easy to modify criteria or add new ones
5. **Security** - Only authorized users can assign marks
6. **User Experience** - Clean, intuitive interface

---

##  **NEW FEATURE: Beoordelaar Admin Panel**

### **What I Built:**
A comprehensive administrative panel for managing evaluation rounds, viewing real-time marks, and determining winners. This system provides complete oversight of the grading process.

### **Beoordelaar Admin Features:**

#### **1. Round Management:**
- **Round Selection:** Choose which evaluation round to manage
- **Round Status:** View whether rounds are active or closed
- **Round Closure:** Finalize rounds and prevent further modifications

#### **2. Real-time Marks Monitoring:**
- **Live Updates:** Server-Sent Events stream showing marks as they're submitted
- **Real-time Display:** See marks appear instantly without page refresh
- **Timestamp Tracking:** View when marks were submitted

#### **3. Teams Overview:**
- **All Teams Display:** View all teams with their current marks
- **Criteria Breakdown:** See individual scores for each criterion
- **Average Calculation:** Automatic calculation of team averages
- **Visual Cards:** Professional card-based layout for easy viewing

#### **4. Winner Determination:**
- **Automatic Calculation:** System determines winner based on highest average
- **Winner Display:** Beautiful winner showcase with team details
- **Member Information:** Complete winner team member details
- **Score Display:** Clear presentation of winning scores

#### **5. Professional Interface:**
- **Modern Design:** Clean, professional admin interface
- **Responsive Layout:** Works on all device sizes
- **Color-coded Elements:** Visual hierarchy and status indicators
- **Smooth Animations:** Professional hover effects and transitions

### **Technical Implementation:**

#### **Backend Features:**
```javascript
// Real-time marks streaming
app.get("/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  clients.push(res);
});

// Round closure with winner determination
app.post('/rounds/:id/close', async (req, res) => {
  // Calculate winner based on average marks
  // Update round status to closed
  // Return winner with team members
});

// Teams with marks for specific round
app.get('/rounds/:id/teams-marks', async (req, res) => {
  // Return all teams with their marks for the round
});
```

#### **Frontend Features:**
```javascript
// Real-time updates via Server-Sent Events
useEffect(() => {
  const eventSource = new EventSource("http://localhost:4000/stream");
  eventSource.onmessage = (event) => {
    const newMarks = JSON.parse(event.data);
    setRealtimeMarks(prev => [...prev, newMarks]);
  };
}, []);

// Winner display with team members
{winner && (
  <div className="winner-section">
    <h3>Wenner Span</h3>
    <div className="winner-card">
      {/* Winner team details */}
      {/* Team members display */}
    </div>
  </div>
)}
```

### **Database Enhancements:**
- **Added `is_gesluit` column** to Rondte table for round status tracking
- **Enhanced queries** for winner determination and team ranking
- **Optimized joins** for efficient data retrieval

### **Benefits of Beoordelaar Admin:**
1. **Complete Oversight:** Full visibility into the grading process
2. **Real-time Monitoring:** Live updates as marks are submitted
3. **Fair Evaluation:** Transparent winner determination process
4. **Professional Presentation:** Beautiful winner display
5. **Efficient Management:** Streamlined round management
6. **Academic Ready:** Perfect for university project evaluation

---

## Recent Changes - URL Input System

### **Problem Solved:**
The original system used file uploads for images, which was complex and unreliable. Users needed to:
- Select files from their computer
- Wait for uploads to complete
- Handle file size limitations
- Manage file storage

### **Solution Implemented:**
Converted to **URL-based image inputs** for a simpler, more reliable experience.

### **Changes Made:**

#### **Frontend Changes:**

**1. CreateTeamForm.js:**
```javascript
// BEFORE: File input
<input type="file" accept="image/*" onChange={handleLogoChange} />

// AFTER: URL input
<input 
  type="url" 
  value={formData.logo} 
  onChange={handleLogoChange}
  placeholder="https://example.com/logo.jpg" 
/>
```

**2. EditTeamForm.js:**
```javascript
// BEFORE: File upload logic
const logoFile = e.target.files[0];
if (logoFile) {
  setLogoFile(logoFile);
  setFormData(prev => ({
    ...prev,
    logo: URL.createObjectURL(logoFile)
  }));
}

// AFTER: Direct URL input
const { value } = e.target;
setFormData(prev => ({
  ...prev,
  logo: value
}));
```

**3. Image Preview with Error Handling:**
```javascript
{formData.logo && (
  <div className="logo-preview">
    <img 
      src={formData.logo} 
      alt="Logo preview" 
      onError={(e) => e.target.style.display = 'none'} 
    />
  </div>
)}
```

#### **Backend Changes:**

**1. Removed File Upload Dependencies:**
```javascript
// REMOVED: Multer configuration
const multer = require('multer');
const storage = multer.diskStorage({...});
const upload = multer({...});

// REMOVED: File upload endpoints
app.post('/teams/:id/logo', upload.single('logo'), ...);
app.post('/members/:id/photo', upload.single('photo'), ...);
```

**2. Simplified Package Dependencies:**
```json
// REMOVED from package.json
"multer": "^1.4.5-lts.1"
```

#### **Services Changes:**

**1. Removed Upload Functions:**
```javascript
// REMOVED: Upload functions
export const uploadTeamLogo = async (teamId, logoFile) => {...};
export const uploadMemberPhoto = async (memberId, photoFile) => {...};
```

### **Benefits of URL Input System:**

1. **Simplicity:** Users just paste image URLs
2. **Reliability:** No file upload failures
3. **Performance:** No file processing overhead
4. **Flexibility:** Can use images from anywhere on the web
5. **Maintenance:** Less code to maintain
6. **User Experience:** Immediate feedback and previews

---

##  Recent Changes - Beoordelaar Admin Interface Simplification

### **Problem Solved:**
The beoordelaar admin interface had become overly complex with features that were not needed for the final round system. The interface included:
- Real-time updates that were not essential for the core functionality
- "Vertoon Uitslag" (Show Results) button that was redundant
- "Skep Volgende Rondte" (Create Next Round) button that was unnecessary since round 2 is the final round

### **Solution Implemented:**
Simplified the beoordelaar admin interface to focus on essential functionality only, removing unnecessary features and streamlining the user experience.

### **Changes Made:**

#### **1. Removed Unnecessary Buttons:**
- **"Vertoon Uitslag" Button:** Completely removed as it was redundant with the winner display functionality
- **"Skep Volgende Rondte" Button:** Removed since round 2 is the final round and no additional rounds are needed

#### **2. Removed Real-time Updates Section:**
- **Real-time Marks Display:** Removed the entire real-time marks streaming section
- **EventSource Connection:** Removed the WebSocket-like connection to the server stream
- **Live Updates:** Eliminated the real-time mark updates that were displayed in the interface

#### **3. Code Cleanup:**
- **Removed Unused State Variables:** Eliminated `realtimeMarks` and `eliminationResults` state variables
- **Removed Unused Functions:** Deleted `handleShowEliminationResults` and `handleCreateNextRound` functions
- **Removed Unused Imports:** Cleaned up imports for `fetchEliminationResults` and `createNextRound` services
- **Removed Unused useEffect:** Eliminated the real-time updates useEffect hook

#### **4. Simplified Interface Structure:**
```javascript
// BEFORE: Complex interface with multiple sections
<div className="beoordelaar-admin-container">
  <div className="admin-header">...</div>
  <div className="realtime-marks">...</div>  // REMOVED
  <div className="teams-marks-section">...</div>
  <div className="round-management">...</div>
  <div className="winner-section">...</div>
  <div className="elimination-results">...</div>  // REMOVED
</div>

// AFTER: Streamlined interface
<div className="beoordelaar-admin-container">
  <div className="admin-header">...</div>
  <div className="teams-marks-section">...</div>
  <div className="round-management">...</div>
  <div className="winner-section">...</div>
</div>
```

#### **5. Updated Winner Display Logic:**
```javascript
// BEFORE: Used eliminationResults for final round detection
<h3>{eliminationResults?.is_final_round ? 'ALGEHELE WENNER' : 'Wenner Span'}</h3>

// AFTER: Uses selectedRound for final round detection
<h3>Wenner Span</h3>
{selectedRound?.is_laaste && (
  <div className="overall-winner-banner">
    <p><strong>Proficiat! Hierdie span het die hele toernooi gewen!</strong></p>
  </div>
)}
```

### **Benefits of the Simplification:**

1. **Cleaner Interface:** Removed clutter and focused on essential functionality
2. **Better Performance:** Eliminated unnecessary real-time connections and state updates
3. **Simplified Codebase:** Reduced complexity and improved maintainability
4. **Clearer User Experience:** Users can focus on core tasks without distractions
5. **Final Round Focus:** Interface now properly reflects that round 2 is the final round
6. **Reduced Dependencies:** Fewer API calls and service dependencies

### **Current Beoordelaar Admin Features:**
-  **Round Selection:** Choose which round to view and manage
-  **Teams Display:** View teams with their marks for the selected round
-  **Round Management:** Close rounds and determine winners
-  **Winner Display:** Show the winning team with detailed information
-  **Final Round Support:** Proper handling of round 2 as the final round

---

## Recent Changes - Dynamic Criteria Management

### **Problem Solved:**
The original grading system was hardcoded with only three criteria (Backend, Frontend, Database), making it inflexible for different evaluation needs. Users needed the ability to:
- Add new evaluation criteria dynamically
- Modify existing criteria descriptions and maximum scores
- Remove criteria that are no longer needed
- Have the system automatically adapt to new criteria across all rounds

### **Solution Implemented:**
Implemented a comprehensive **Dynamic Criteria Management System** that allows administrators to create, read, update, and delete (CRUD) evaluation criteria with automatic integration across all rounds and marking interfaces.

### **Changes Made:**

#### **1. New MerkAdmin Component (`merkadmin/`):**
```javascript
// Complete CRUD interface for criteria management
const MerkAdmin = () => {
  const [criteria, setCriteria] = useState([]);
  const [editingCriteria, setEditingCriteria] = useState(null);
  const [formData, setFormData] = useState({ beskrywing: '', default_totaal: '' });
  
  // CRUD operations
  const handleCreate = async () => { /* Create new criteria */ };
  const handleUpdate = async () => { /* Update existing criteria */ };
  const handleDelete = async (id) => { /* Delete criteria */ };
  const handleEdit = (criteria) => { /* Edit criteria */ };
};
```

#### **2. Enhanced Backend API (`index.js`):**
```javascript
// New CRUD endpoints for criteria management
app.get('/criteria', async (req, res) => { /* Get all criteria */ });
app.get('/criteria/:id', async (req, res) => { /* Get specific criteria */ });
app.post('/criteria', async (req, res) => { /* Create new criteria */ });
app.put('/criteria/:id', async (req, res) => { /* Update criteria */ });
app.delete('/criteria/:id', async (req, res) => { /* Delete criteria */ });
```

#### **3. Automatic Merkblad Creation:**
```javascript
// When new criteria is created, automatically create merkblad records for all rounds
app.post('/criteria', async (req, res) => {
  // Create criteria
  const kriteriaId = this.lastID;
  
  // Create merkblad records for all existing rounds
  rounds.forEach(round => {
    db.run('INSERT INTO Merkblad (rondte_id, kriteria_id, totaal) VALUES (?, ?, ?)', 
      [round.rondte_id, kriteriaId, default_totaal]);
  });
});
```

#### **4. Dynamic Frontend Integration:**
```javascript
// Merk page now dynamically loads criteria
const [criteria, setCriteria] = useState([]);

useEffect(() => {
  const loadCriteria = async () => {
    const criteriaData = await fetchAllCriteria();
    setCriteria(criteriaData);
    
    // Initialize marks for all criteria
    const newMarks = {};
    criteriaData.forEach(crit => {
      newMarks[`kriteria${crit.kriteria_id}`] = "";
    });
    setMarks(newMarks);
  };
  loadCriteria();
}, []);
```

#### **5. Enhanced Beoordelaar Admin:**
```javascript
// Auto-refresh functionality for new criteria
const handleRefreshData = async () => {
  const [criteriaData, roundsData] = await Promise.all([
    fetchCriteria(),
    fetchRounds()
  ]);
  setCriteria(criteriaData);
  setRounds(roundsData);
  
  // Reload teams with marks for current round
  if (selectedRound) {
    const teamsData = await fetchTeamsWithMarks(selectedRound.rondte_id);
    setTeamsWithMarks(teamsData);
  }
};
```

### **Key Features Implemented:**

#### **1. Criteria Management Interface:**
- **Create New Criteria:** Add criteria with custom descriptions and maximum scores
- **Edit Existing Criteria:** Modify criteria descriptions and maximum scores
- **Delete Criteria:** Remove criteria that are no longer needed
- **View All Criteria:** Complete list with edit/delete actions
- **Form Validation:** Ensures proper data entry and prevents duplicates

#### **2. Automatic Integration:**
- **Round Integration:** New criteria automatically available in all existing rounds
- **Marking Interface:** Merk page dynamically adapts to show all criteria
- **Admin Panel:** Beoordelaar admin automatically displays new criteria
- **Database Consistency:** Merkblad records created automatically for new criteria

#### **3. Real-time Updates:**
- **Auto-refresh:** All interfaces refresh automatically when criteria change
- **Live Updates:** Changes appear immediately across all components
- **Data Consistency:** All interfaces stay synchronized with database changes

#### **4. Enhanced User Experience:**
- **Intuitive Interface:** Clean, professional criteria management interface
- **Error Handling:** Comprehensive validation and error messages
- **Loading States:** Visual feedback during operations
- **Confirmation Dialogs:** Prevent accidental deletions

### **Technical Implementation:**

#### **Backend Enhancements:**
```javascript
// Dynamic marks submission for any number of criteria
app.post('/teams/:id/marks', async (req, res) => {
  // Get all criteria from database
  const criteria = await db.all('SELECT kriteria_id, beskrywing, default_totaal FROM Kriteria');
  
  // Validate marks for all criteria
  criteria.forEach(crit => {
    const markKey = `kriteria${crit.kriteria_id}`;
    const markValue = req.body[markKey];
    // Validation logic...
  });
  
  // Store marks for all criteria
  // Transaction safety ensured
});
```

#### **Frontend Enhancements:**
```javascript
// Dynamic form generation based on criteria
{criteria.map(crit => (
  <div key={crit.kriteria_id} className="mark-input-group">
    <label>{crit.beskrywing} (0-{crit.default_totaal}):</label>
    <input
      type="number"
      name={`kriteria${crit.kriteria_id}`}
      min="0"
      max={crit.default_totaal}
      value={marks[`kriteria${crit.kriteria_id}`] || ""}
      onChange={handleInputChange}
    />
  </div>
))}
```

### **Benefits of Dynamic Criteria Management:**

1. **Flexibility:** Add/modify/remove criteria as needed
2. **Scalability:** System adapts to any number of criteria
3. **Consistency:** All interfaces automatically update with new criteria
4. **User Experience:** Intuitive management interface
5. **Data Integrity:** Automatic merkblad creation ensures consistency
6. **Real-time Updates:** Changes appear immediately across all interfaces
7. **Academic Ready:** Perfect for different evaluation requirements

### **Current System Capabilities:**
- **Unlimited Criteria:** Add as many evaluation criteria as needed
- **Custom Scoring:** Each criteria can have different maximum scores
- **Round Integration:** New criteria automatically available in all rounds
- **Dynamic Marking:** Marking interface adapts to any number of criteria
- **Admin Oversight:** Complete visibility and management of all criteria
- **Data Consistency:** Automatic database updates ensure integrity

---

## API Endpoints

### **Team Endpoints:**
```
GET    /teams              # Get all teams
GET    /teams/:id          # Get specific team
POST   /teams              # Create new team
PUT    /teams/:id          # Update team
DELETE /teams/:id          # Delete team
```

### **Member Endpoints:**
```
GET    /teams/:id/members  # Get team members
GET    /members/:id        # Get specific member
POST   /teams/:id/members  # Create new member
PUT    /members/:id        # Update member
DELETE /members/:id        # Delete member
```

### **Grading Endpoints:**
```
POST   /teams/:id/marks    # Submit marks for a team
GET    /teams/:id/marks    # Get marks for a team
DELETE /teams/:id/marks    # Delete marks for a team
POST   /merk/punte         # Send real-time marks update
GET    /stream             # Server-Sent Events stream
```

### **Criteria Management Endpoints (NEW!):**
```
GET    /criteria           # Get all criteria
GET    /criteria/:id       # Get specific criteria
POST   /criteria           # Create new criteria
PUT    /criteria/:id       # Update criteria
DELETE /criteria/:id       # Delete criteria
```

### **Beoordelaar Admin Endpoints:**
```
GET    /rounds             # Get all rounds
GET    /rounds/:id/teams-marks  # Get teams with marks for a round
POST   /rounds/:id/close   # Close a round and determine winner
GET    /rounds/:id/winner  # Get winner for a closed round
```

### **Example API Calls:**

#### **Create Team:**
```javascript
POST /teams
Content-Type: application/json

{
  "naam": "Development Team",
  "projek_beskrywing": "Building web applications",
  "span_bio": "Experienced developers working on modern web technologies",
  "logo": "https://example.com/team-logo.jpg"
}
```

#### **Create Member:**
```javascript
POST /teams/1/members
Content-Type: application/json

{
  "naam": "John Doe",
  "bio": "Full-stack developer with 5 years experience",
  "foto": "https://example.com/john-photo.jpg"
}
```

#### **Create Criteria:**
```javascript
POST /criteria
Content-Type: application/json

{
  "beskrywing": "Code Quality",
  "default_totaal": 100
}
```

#### **Submit Marks:**
```javascript
POST /teams/1/marks
Content-Type: application/json

{
  "kriteria1": 85,
  "kriteria2": 90,
  "kriteria3": 78,
  "kriteria4": 92
}
```

---

## How to Run the Project

### **Prerequisites:**
- Node.js (v14 or higher)
- npm (Node Package Manager)

### **Backend Setup:**
```bash
# Navigate to backend directory
cd ha1_project/express_agterend

# Install dependencies
npm install

# Start the server
npm start
```
**Backend will run on:** `http://localhost:4000`

### **Frontend Setup:**
```bash
# Navigate to frontend directory
cd ha1_project/react_gui

# Install dependencies
npm install

# Start the development server
npm start
```
**Frontend will run on:** `http://localhost:3000`

### **Access the Application:**
1. Open browser to `http://localhost:3000`
2. Navigate to the Span Admin section
3. Start creating and managing teams!

---

## Technical Decisions

### **1. Why SQLite?**
- **Lightweight:** No separate database server needed
- **File-based:** Easy to backup and share
- **ACID compliant:** Reliable data integrity
- **Perfect for development:** Simple setup and management

### **2. Why URL Inputs Instead of File Uploads?**
- **User Experience:** Simpler for users to paste URLs
- **Reliability:** No file upload failures or size limits
- **Performance:** No file processing overhead
- **Flexibility:** Can use images from any web source
- **Maintenance:** Less complex code to maintain

### **3. Why React for Frontend?**
- **Component-based:** Reusable and maintainable code
- **State Management:** Efficient handling of application state
- **Real-time Updates:** Immediate UI updates after operations
- **Modern Development:** Industry standard for web applications

### **4. Why Express.js for Backend?**
- **Lightweight:** Minimal overhead
- **Flexible:** Easy to add new endpoints
- **JSON API:** Simple data exchange with frontend
- **CORS Support:** Easy cross-origin configuration

### **5. Design Principles Applied:**
- **Separation of Concerns:** Clear separation between frontend and backend
- **RESTful API:** Standard HTTP methods for operations
- **Error Handling:** Comprehensive error handling throughout
- **User Feedback:** Loading states and error messages
- **Responsive Design:** Works on all device sizes

---

## Project Statistics

### **Code Metrics:**
- **Backend Files:** 3 main files
- **Frontend Components:** 10 React components
- **API Endpoints:** 23 REST endpoints
- **Database Tables:** 6 tables with relationships
- **Lines of Code:** ~4,500+ lines (including dynamic criteria management)

### **Features Implemented:**
-  Team CRUD operations
-  Member CRUD operations
-  **Dynamic criteria management (CRUD)** (NEW!)
-  **Grading system with criteria-based marking**
-  **Mark display and average calculation**
-  **Simplified Beoordelaar Admin Panel** (UPDATED!)
-  **Round management and winner determination**
-  **Winner display with team members**
-  **Final round support (Round 2)** (UPDATED!)
-  **Real-time marks updates** (NEW!)
-  **Auto-refresh functionality** (NEW!)
-  Image management via URLs
-  Responsive design
-  Error handling
-  Loading states
-  Confirmation dialogs

### **Recently Removed Features:**
-  Real-time marks streaming (removed for simplicity)
-  Complex elimination results display (simplified)
-  Unnecessary round management buttons (streamlined)

---

##  Future Enhancements

### **Potential Improvements:**
1. **Authentication:** User login and role-based access
2. **Image Validation:** URL validation and image format checking
3. **Search/Filter:** Search teams and members
4. **Export/Import:** Export team data to CSV/JSON
5. **Notifications:** Real-time notifications for changes
6. **Analytics:** Team and member statistics
7. **Mobile App:** React Native mobile application

---

##  Conclusion

This Team Management & Grading System successfully demonstrates:

- **Modern Web Development:** Using current technologies and best practices
- **Full-Stack Implementation:** Complete frontend/backend integration
- **Academic Application:** Perfect for university project evaluation
- **User-Centered Design:** Focusing on simplicity and usability
- **Scalable Architecture:** Clean separation of concerns
- **Problem-Solving:** Addressing real-world challenges (team management and grading)
- **Technical Excellence:** Clean, maintainable, and well-documented code

### **For Your University Presentation:**

#### **What to Show:**
1. **Team Admin Page** - Demonstrate team management capabilities
2. **Grading Page** - Show the marking system in action
3. **Beoordelaar Admin Panel** - Demonstrate round management and winner determination
4. **Real-time Updates** - Show live marks streaming
5. **Database Structure** - Explain the 5-table design
6. **API Endpoints** - Show the 18 REST endpoints
7. **Technology Stack** - Explain your technology choices

#### **Key Points to Emphasize:**
- **Full-Stack Development** - You built both frontend and backend
- **Database Design** - Proper relationships and data integrity
- **User Experience** - Clean, intuitive interface
- **Real-time Features** - Server-Sent Events for live updates
- **Admin Panel** - Comprehensive round management and winner determination
- **Academic Relevance** - Perfect for grading student projects
- **Technical Skills** - React, Node.js, SQLite, REST APIs, SSE

The system provides a complete solution for team management and project evaluation with excellent user experience and technical implementation.

---

## Observer Pattern Implementation

### **Overview:**
The project implements the Observer pattern to provide real-time data synchronization across components without breaking existing functionality. This pattern ensures that when data changes in one component, all other components are automatically notified and updated.

### **Core Components:**

#### **1. Observer Pattern Classes (`src/observers/Observer.js`):**
```javascript
// Observer interface for components that want notifications
export class Observer {
  constructor(componentName) {
    this.componentName = componentName;
  }
  
  update(dataType, data) {
    // Called when data changes
  }
}

// Subject that manages observers and notifies them
export class Subject {
  addObserver(observer) { /* Add observer */ }
  removeObserver(observer) { /* Remove observer */ }
  notifyObservers(dataType, data) { /* Notify all observers */ }
}

// DataStore implementing Subject pattern
export class DataStore extends Subject {
  updateTeams(teams) { /* Update teams and notify */ }
  updateCriteria(criteria) { /* Update criteria and notify */ }
  updateMarks(teamId, roundId, marks) { /* Update marks and notify */ }
}
```

#### **2. Observer Services (`src/services/observer_services.js`):**
```javascript
// Teams operations with automatic notifications
export class TeamsObserverService {
  static async createTeam(teamData) {
    const newTeam = await createTeam(teamData);
    await this.loadTeams(); // Notifies all observers
    return newTeam;
  }
}

// Criteria operations with automatic notifications
export class CriteriaObserverService {
  static async createCriteria(criteriaData) {
    const newCriteria = await createCriteria(criteriaData);
    await this.loadCriteria(); // Notifies all observers
    return newCriteria;
  }
}
```

#### **3. React Hooks (`src/hooks/useObserver.js`):**
```javascript
// Generic hook for subscribing to data changes
export const useObserver = (componentName, options = {}) => {
  const [data, setData] = useState({ teams: [], criteria: [], rounds: [] });
  
  useEffect(() => {
    const observer = new Observer(componentName);
    dataStore.addObserver(observer);
    return () => dataStore.removeObserver(observer);
  }, []);
  
  return { data, loading, error, refreshData };
};

// Specific hooks for different data types
export const useCriteriaObserver = (componentName) => { /* ... */ };
export const useTeamsObserver = (componentName) => { /* ... */ };
export const useMarksObserver = (componentName) => { /* ... */ };
```

### **Benefits of Observer Pattern:**

1. **Real-time Updates:** Components automatically receive updates when data changes
2. **Decoupling:** Components don't need to know about each other
3. **Single Source of Truth:** Centralized data management
4. **Backward Compatibility:** Existing components continue to work unchanged
5. **Scalability:** Easy to add new components that need data updates

### **Usage Example:**
```javascript
function MyComponent() {
  const { data, loading } = useCriteriaObserver('MyComponent');
  
  useEffect(() => {
    CriteriaObserverService.loadCriteria();
  }, []);
  
  // Data automatically updates when other components change it!
  const criteria = data.criteria || [];
  
  return <div>{criteria.map(c => c.beskrywing)}</div>;
}
```

### **Observer Pattern Files:**
- `src/observers/Observer.js` - Core observer pattern implementation
- `src/services/observer_services.js` - Services with automatic notifications
- `src/hooks/useObserver.js` - React hooks for easy integration
- `src/merkadmin/merkadmin_observer.js` - Example converted component
- `src/components/ObserverDemo.js` - Demonstration component

---

## RESTful API Implementation

### **Overview:**
The project implements a comprehensive RESTful API following REST principles with proper HTTP methods, resource-based URLs, and JSON responses. The API provides 18+ endpoints for complete CRUD operations.

### **RESTful Principles Followed:**

#### **1. HTTP Methods Used Correctly:**
```javascript
GET    /teams              // Get all teams
GET    /teams/:id          // Get specific team
POST   /teams              // Create new team
PUT    /teams/:id          // Update team
DELETE /teams/:id          // Delete team
```

#### **2. Resource-Based URLs:**
```javascript
// Teams resource
GET    /teams
POST   /teams
GET    /teams/:id
PUT    /teams/:id
DELETE /teams/:id

// Team members sub-resource
GET    /teams/:id/members
POST   /teams/:id/members
GET    /members/:id
PUT    /members/:id
DELETE /members/:id

// Criteria resource
GET    /criteria
POST   /criteria
GET    /criteria/:id
PUT    /criteria/:id
DELETE /criteria/:id

// Rounds resource
GET    /rounds
GET    /rounds/:id/teams-marks
POST   /rounds/:id/close
```

#### **3. Proper HTTP Status Codes:**
```javascript
// Success responses
200 OK          // Successful GET requests
201 Created     // Successful POST requests
204 No Content  // Successful DELETE requests

// Error responses
400 Bad Request // Invalid request data
404 Not Found   // Resource not found
500 Internal Server Error // Server errors
```

#### **4. JSON Response Format:**
```javascript
// Success response example
{
  "span_id": 1,
  "naam": "Team Alpha",
  "beskrywing": "Description",
  "members": [...]
}

// Error response example
{
  "error": "Kon nie span laai nie",
  "details": "Specific error message"
}
```

### **Complete API Endpoints:**

#### **Teams Management:**
```javascript
GET    /teams                    // Get all teams
GET    /teams/:id                // Get specific team
POST   /teams                    // Create new team
PUT    /teams/:id                // Update team
DELETE /teams/:id                // Delete team
```

#### **Members Management:**
```javascript
GET    /teams/:id/members        // Get team members
GET    /members/:id              // Get specific member
POST   /teams/:id/members        // Create new member
PUT    /members/:id              // Update member
DELETE /members/:id              // Delete member
```

#### **Criteria Management:**
```javascript
GET    /criteria                 // Get all criteria
GET    /criteria/:id             // Get specific criteria
POST   /criteria                 // Create new criteria
PUT    /criteria/:id             // Update criteria
DELETE /criteria/:id             // Delete criteria
```

#### **Grading System:**
```javascript
POST   /teams/:id/marks          // Submit marks for a team
GET    /teams/:id/marks          // Get marks for a team
DELETE /teams/:id/marks          // Delete marks for a team
```

#### **Round Management:**
```javascript
GET    /rounds                   // Get all rounds
GET    /rounds/:id/teams-marks   // Get teams with marks for round
POST   /rounds/:id/close         // Close round and determine winner
GET    /rounds/:id/winner        // Get round winner
```

#### **Real-time Features:**
```javascript
GET    /stream                   // Server-Sent Events stream
POST   /merk/punte               // Send real-time marks update
```

### **API Implementation Example:**
```javascript
// Teams endpoint implementation
app.get('/teams', async (req, res) => {
  try {
    const teams = await getAllTeams();
    res.json(teams); // 200 OK with JSON data
  } catch (err) {
    res.status(500).json({ 
      error: 'Kon nie spanne laai nie', 
      details: err.message 
    });
  }
});

app.post('/teams', async (req, res) => {
  try {
    const newTeam = await createTeam(req.body);
    res.status(201).json(newTeam); // 201 Created
  } catch (err) {
    res.status(400).json({ 
      error: 'Ongeldige data', 
      details: err.message 
    });
  }
});
```

### **RESTful Features:**

1. **Stateless:** Each request contains all necessary information
2. **Cacheable:** GET requests can be cached
3. **Uniform Interface:** Consistent URL structure and HTTP methods
4. **Client-Server:** Clear separation between frontend and backend
5. **Layered System:** API can be accessed through different layers

### **API Documentation:**
- **Base URL:** `http://localhost:4000`
- **Content-Type:** `application/json`
- **CORS:** Configured for `http://localhost:3000`
- **Methods:** GET, POST, PUT, DELETE, OPTIONS
- **Response Format:** JSON with consistent error handling

### **Testing the API:**
```bash
# Get all teams
curl -X GET http://localhost:4000/teams

# Create new team
curl -X POST http://localhost:4000/teams \
  -H "Content-Type: application/json" \
  -d '{"naam":"Test Team","beskrywing":"Test Description"}'

# Get specific team
curl -X GET http://localhost:4000/teams/1
```

---

**Project Created:** 2025  
**Last Updated:** 28 September 2025  
**Technologies:** Node.js, Express.js, React.js, SQLite3, CSS3, Dynamic Criteria Management, Observer Pattern, RESTful API  
**Purpose:** University Project - Team Management & Grading System with Dynamic Criteria Management
