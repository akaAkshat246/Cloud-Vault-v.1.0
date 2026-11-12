import { DataSource } from 'typeorm';
import { Plan } from '../entities/Plan.js';
import { AppDataSource } from '../data-source.js';
import { logger } from '../../utils/logger.js';

export const INITIAL_PLANS = [
  {
    name: 'Free',
    quota_bytes: '5368709120', // 5 GiB
    price_inr: 0,
    payment_provider_ref: null,
    is_active: true
  },
  {
    name: 'Personal',
    quota_bytes: '107374182400', // 100 GiB
    price_inr: 149,
    payment_provider_ref: 'price_personal_100gb_monthly',
    is_active: true
  },
  {
    name: 'Pro',
    quota_bytes: '1099511627776', // 1 TiB
    price_inr: 349,
    payment_provider_ref: 'price_pro_1tb_monthly',
    is_active: true
  }
];

export async function seedPlans(dataSource: DataSource = AppDataSource): Promise<void> {
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }

  const planRepository = dataSource.getRepository(Plan);

  for (const planData of INITIAL_PLANS) {
    const existingPlan = await planRepository.findOne({ where: { name: planData.name } });
    if (!existingPlan) {
      const plan = planRepository.create(planData);
      await planRepository.save(plan);
      logger.info({ plan: planData.name }, 'Seed: created plan');
    } else {
      await planRepository.update(existingPlan.id, planData);
      logger.info({ plan: planData.name }, 'Seed: updated plan');
    }
  }

  logger.info('Plan seeding completed idempotently.');
}

// Allow direct execution
if (process.argv[1] && process.argv[1].endsWith('plan.seed.ts')) {
  seedPlans()
    .then(() => {
      logger.info('Seeding finished successfully.');
      process.exit(0);
    })
    .catch((err) => {
      logger.error({ error: err }, 'Plan seeding failed');
      process.exit(1);
    });
}

