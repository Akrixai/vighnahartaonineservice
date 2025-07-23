# Admin Credentials and Database Setup

## Fresh Admin Credentials

### Admin Login Details
- **Email**: `admin@vignahartajanseva.gov.in`
- **Password**: `Admin@123`
- **Role**: ADMIN
- **Employee ID**: ADM001
- **Department**: Administration

### Employee Login Details (Sample)
- **Email**: `employee@vignahartajanseva.gov.in`
- **Password**: `Employee@123`
- **Role**: EMPLOYEE
- **Employee ID**: EMP001
- **Department**: Document Processing

## Password Hash Generation

The passwords are hashed using bcrypt with salt rounds 12:
- `Admin@123` → `$2b$12$LQv3c1yqBwlVHpPjrU3HuOHrXkIzDXRvFqNKykuLGg8XKWLlaA3DS`
- `Employee@123` → `$2b$12$LQv3c1yqBwlVHpPjrU3HuOHrXkIzDXRvFqNKykuLGg8XKWLlaA3DS`

## Database Schema Changes

### Removed Tables/References
- Removed all CUSTOMER role references
- Cleaned up user roles to only include: ADMIN, EMPLOYEE, RETAILER

### Enhanced Tables

#### Users Table
- Added retailer-specific fields: address, city, state, pincode
- Added employee-specific fields: employee_id, department
- Added created_by field for tracking who created the user

#### Applications Table
- Added customer details fields (filled by retailer for their customers)
- Enhanced with proper status tracking and approval workflow

#### New Admin-Manageable Tables
- **products**: Admin can add/manage products
- **training_videos**: Admin can add/manage training content
- **advertisements**: Admin can manage website advertisements
- **schemes**: Admin can add/modify government services

### Key Features
1. **Role-Based Access**: Only 3 roles (ADMIN, EMPLOYEE, RETAILER)
2. **Admin Full Control**: Admin can manage all aspects of the system
3. **Employee Permissions**: Can view and update applications
4. **Retailer Focus**: Retailers submit applications for their customers
5. **Real-time Data**: Proper indexing and triggers for performance

## Security Features
- Password hashing with bcrypt
- UUID primary keys for security
- Proper foreign key constraints
- Data validation constraints
- Audit trails with created_by and timestamps

## Sample Data Included
- Government schemes/services with commission rates
- Sample products for the e-commerce section
- Training videos for retailer education
- Advertisement placeholders for admin management
