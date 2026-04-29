# Parent Dashboard - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Backend running on `http://localhost:8000`
- Frontend running on `http://localhost:5173` (or your configured port)
- MongoDB connection configured
- Parent account created

### Step 1: Register as Parent

**Via Login Page:**
1. Navigate to `/login`
2. Click "Register"
3. Select "Parent" as role
4. Fill in details:
   - Name
   - Email
   - Password
   - (Optional) Child's email to auto-link

**Via API:**
```bash
POST /auth/register
{
  "name": "John Parent",
  "email": "parent@example.com",
  "password": "securePassword",
  "role": "parent",
  "child_email": "student@example.com" // Optional
}
```

### Step 2: Link Children

**Option A: During Registration**
- Provide child's email during signup
- Child will be automatically linked

**Option B: After Registration**
1. Go to `/parent/children`
2. Click "Link Child"
3. Enter child's email
4. Click "Link Child" button

**Via API:**
```bash
POST /parent/link-child
{
  "child_email": "student@example.com"
}
```

### Step 3: Explore Dashboard

1. **Main Dashboard** (`/parent`)
   - View all children
   - Quick stats
   - Quick access to features

2. **Children Management** (`/parent/children`)
   - Link new children
   - View all linked children
   - See child details

3. **Report Cards** (`/parent/report-cards`)
   - Select a child
   - View comprehensive report card
   - See subject-wise performance

4. **Progress Tracking** (`/parent/progress`)
   - Select a child
   - View detailed progress metrics
   - See recent submissions

5. **Notifications** (`/parent/notifications`)
   - View all notifications
   - See homework assignments
   - Track submission updates

6. **Profile** (`/parent/profile`)
   - Edit profile information
   - Change password
   - Manage settings

---

## 📱 Main Features at a Glance

### Dashboard
```
GET /parent/dashboard
Response: {
  "children": [...],
  "total_children": 2,
  "total_pending_homework": 5
}
```

### Report Card
```
GET /parent/child/{child_id}/report-card
Response: {
  "report_card": {
    "overall_grade": "A",
    "overall_percentage": 92.5,
    "subjects": [...]
  }
}
```

### Progress
```
GET /parent/child/{child_id}/progress
Response: {
  "overall_percentage": 92.5,
  "progress_by_subject": [...]
}
```

### Homework
```
GET /parent/child/{child_id}/homework
Response: {
  "homework": [...],
  "count": 5
}
```

### Link Child
```
POST /parent/link-child
Body: {
  "child_email": "student@example.com"
}
```

---

## 🎨 UI Navigation Map

```
/parent (Main Dashboard)
├── Overview & Stats
├── Children Cards
└── Quick Access Links
    │
    ├── /parent/children (Children Management)
    │   ├── Link New Child Form
    │   └── Children List
    │
    ├── /parent/report-cards (Report Cards)
    │   ├── Child Selector
    │   ├── Overall Performance
    │   └── Subject Details
    │
    ├── /parent/progress (Progress Tracking)
    │   ├── Child Selector
    │   ├── Overall Metrics
    │   ├── Subject Progress
    │   └── Recent Submissions
    │
    ├── /parent/notifications (Notifications)
    │   ├── Notification Feed
    │   └── Filters
    │
    └── /parent/profile (Profile)
        ├── Profile Edit
        └── Settings
```

---

## 🔍 Common Tasks

### View Child's Report Card
1. Go to `/parent/report-cards`
2. Select child from dropdown
3. View overall grade and subjects
4. Check individual subject performance

### Track Homework Progress
1. Go to `/parent/progress`
2. Select child
3. View subject-wise progress
4. Check recent submissions with scores

### Link Multiple Children
1. Go to `/parent/children`
2. Enter first child's email → Link
3. Enter second child's email → Link
4. View all children in list

### Check Notifications
1. Go to `/parent/notifications`
2. See all updates and announcements
3. Read parent-specific notifications

---

## 💡 Tips & Tricks

### Using Child Selection
- Most pages have a child selector at the top
- Current selection is remembered during session
- Switch between children easily

### Understanding Grades
- **A**: 90-100% (Excellent)
- **B**: 80-89% (Good)
- **C**: 70-79% (Average)
- **D**: 60-69% (Below Average)
- **F**: <60% (Failing)

### Report Card Interpretation
- **Overall Grade**: Aggregate of all subjects
- **Percentage**: Score as percentage of total possible
- **Submissions**: Number of assignments completed
- **Average**: Average score per assignment

### Navigation Sidebar
- Click item to navigate
- Hover for tooltip on collapsed view
- Click collapse button to toggle sidebar
- Active page is highlighted

---

## ⚠️ Common Issues & Solutions

### Issue: Child Not Appearing After Linking
**Solution:**
- Ensure child is registered as a student
- Check email matches exactly
- Refresh page after linking
- Check browser console for errors

### Issue: Report Card Shows No Data
**Solution:**
- Child must have submitted homework
- Teacher must evaluate the homework
- Wait for evaluation to complete
- Try refreshing the page

### Issue: Can't Link Child
**Solution:**
- Verify child's email is correct
- Ensure child account is a "student"
- Check that email is already registered
- Try linking from `/parent/children` page

### Issue: Notifications Not Showing
**Solution:**
- Ensure backend is running
- Check API endpoint is accessible
- Verify JWT token is valid
- Clear browser cache and reload

---

## 🔐 Security Tips

### Protect Your Account
- Use strong, unique passwords
- Don't share your login credentials
- Log out after each session
- Clear cookies periodically

### Child Safety
- Review homework and submissions regularly
- Monitor conduct notes from teachers
- Check attendance patterns
- Look for behavior changes

### Data Privacy
- Only access your own children's data
- Don't share child information with others
- Report any unauthorized access
- Contact support if suspicious activity detected

---

## 📊 Understanding the Data

### Report Card
- Shows cumulative grades across all subjects
- Calculated from evaluated submissions
- Letter grades based on percentage
- Updated as teachers evaluate

### Progress
- Real-time subject-wise breakdown
- Shows completion rate per subject
- Average score calculation
- Recent submissions listed with scores

### Attendance (When Integrated)
- Tracking present, absent, leave days
- Monthly breakdown provided
- Percentage calculation
- Alerts for low attendance

---

## 🎓 For Parents with Multiple Children

### Workflow
1. Go to Dashboard → See all children
2. Click on child card or select from dropdown
3. View specific child's data
4. Switch to another child anytime
5. Compare siblings' progress

### Multi-Child Dashboard
- All children overview on main dashboard
- Quick stats for each child
- Easy switching between children
- Individual tracking per child

---

## 📞 Support

### Getting Help
- Check documentation: `/PARENT_DASHBOARD.md`
- Review this quick start guide
- Check browser console for errors
- Contact development team

### Reporting Issues
1. Note the error message
2. Note what you were trying to do
3. Include browser/device info
4. Contact support with details

---

## 🚀 Next Steps

1. **Explore Features**: Spend time familiarizing with each page
2. **Review Reports**: Regularly check report cards and progress
3. **Monitor Homework**: Keep track of pending assignments
4. **Check Notifications**: Stay updated with school announcements
5. **Update Profile**: Keep contact information current

---

**Last Updated**: April 28, 2026  
**Version**: 1.0  
**For Support**: Contact admin@smartcampus.edu

