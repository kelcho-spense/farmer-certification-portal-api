import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { UserRole, CertificationStatus } from '../common/enums';
import 'dotenv/config';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'farmer_certification',
  entities: [User],
  synchronize: true,
});

async function seed() {
  console.log('Starting database seeding...');

  try {
    await AppDataSource.initialize();
    console.log('Database connection established');

    const userRepository = AppDataSource.getRepository(User);

    // Check if admin already exists
    const existingAdmin = await userRepository.findOne({
      where: { email: 'admin@farmcert.com' },
    });

    if (existingAdmin) {
      console.log('Admin user already exists, skipping...');
    } else {
      // Create admin user
      const hashedPassword = await bcrypt.hash('Admin@123', 10);

      const admin = new User();
      admin.email = 'admin@farmcert.com';
      admin.password = hashedPassword;
      admin.name = 'System Administrator';
      admin.role = UserRole.ADMIN;
      admin.status = CertificationStatus.CERTIFIED;

      await userRepository.save(admin);
      console.log('Admin user created successfully');
      console.log('Email: admin@farmcert.com');
      console.log('Password: Admin@123');
    }

    console.log('Database seeding completed!');
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

seed();
