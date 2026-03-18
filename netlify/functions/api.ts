
import { neon } from '@neondatabase/serverless';

// Netlify Function Handler
export const handler = async (event: any) => {
  // 安全性檢查：確保資料庫連線字串存在於環境變數中
  if (!process.env.DATABASE_URL) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing DATABASE_URL environment variable' }),
    };
  }

  const sql = neon(process.env.DATABASE_URL);
  
  // 取得請求參數
  const { action } = event.queryStringParameters || {};
  
  // 解析 Body (如果是 POST 請求)
  let body: any = {};
  if (event.body) {
    try {
      body = JSON.parse(event.body);
    } catch (e) {
      // Body parsing error
    }
  }

  try {
    let result;

    switch (action) {
      // --- USERS ---
      case 'getUsers':
        result = await sql`SELECT * FROM users`;
        break;
      
      case 'saveUser':
        if (body.isNew) {
          await sql`
            INSERT INTO users (username, password, role, name)
            VALUES (${body.user.username}, ${body.user.password}, ${body.user.role}, ${body.user.name})
          `;
        } else {
          await sql`
            UPDATE users 
            SET password = ${body.user.password}, role = ${body.user.role}, name = ${body.user.name}
            WHERE username = ${body.user.username}
          `;
        }
        result = { success: true };
        break;

      case 'deleteUser':
        await sql`DELETE FROM users WHERE username = ${body.username}`;
        result = { success: true };
        break;

      // --- BILLS ---
      case 'getBills':
        result = await sql`SELECT * FROM bills`;
        break;

      case 'saveBill':
        const bill = body;
        await sql`
          INSERT INTO bills (
            id, roc_year, month, usage, amount, billing_period, 
            contract_capacity, max_demand, power_factor, meter_number,
            current_reading, last_reading, usage_category, payment_deadline,
            basic_fee, flow_fee, payment_adjustment, others
          ) VALUES (
            ${bill.id}, ${bill.rocYear}, ${bill.month}, ${bill.usage}, ${bill.amount}, ${bill.billingPeriod || null},
            ${bill.contractCapacity || null}, ${bill.maxDemand || null}, ${bill.powerFactor || null}, ${bill.meterNumber || null},
            ${bill.currentReading || null}, ${bill.lastReading || null}, ${bill.usageCategory || null}, ${bill.paymentDeadline || null},
            ${bill.basicFee || 0}, ${bill.flowFee || 0}, ${bill.paymentAdjustment || 0}, ${bill.others || 0}
          )
          ON CONFLICT (id) DO UPDATE SET
            usage = EXCLUDED.usage,
            amount = EXCLUDED.amount,
            contract_capacity = EXCLUDED.contract_capacity,
            max_demand = EXCLUDED.max_demand,
            current_reading = EXCLUDED.current_reading,
            last_reading = EXCLUDED.last_reading,
            usage_category = EXCLUDED.usage_category,
            basic_fee = EXCLUDED.basic_fee,
            flow_fee = EXCLUDED.flow_fee,
            payment_adjustment = EXCLUDED.payment_adjustment,
            others = EXCLUDED.others
        `;
        result = { success: true };
        break;

      case 'deleteBill':
        await sql`DELETE FROM bills WHERE id = ${body.id}`;
        result = { success: true };
        break;

      // --- TOP UPS ---
      case 'getTopUps':
        result = await sql`SELECT * FROM top_up_records ORDER BY date DESC`;
        break;

      case 'saveTopUp':
        await sql`
          INSERT INTO top_up_records (id, date, points, amount, note)
          VALUES (${body.id}, ${body.date}, ${body.points}, ${body.amount}, ${body.note || null})
          ON CONFLICT (id) DO UPDATE SET
            date = EXCLUDED.date,
            points = EXCLUDED.points,
            amount = EXCLUDED.amount
        `;
        result = { success: true };
        break;

      case 'deleteTopUp':
        await sql`DELETE FROM top_up_records WHERE id = ${body.id}`;
        result = { success: true };
        break;

      // --- FACILITY USAGE ---
      case 'getFacilityUsages':
        result = await sql`SELECT * FROM facility_usage`;
        break;

      case 'saveFacilityUsage':
        await sql`
          INSERT INTO facility_usage (id, year, month, gym_count, game_room_count, kitchen_count, av_room_count, k1_space_count)
          VALUES (
            ${body.id}, ${body.year}, ${body.month}, 
            ${body.gymCount}, ${body.gameRoomCount}, ${body.kitchenCount}, 
            ${body.avRoomCount}, ${body.k1SpaceCount}
          )
          ON CONFLICT (id) DO UPDATE SET
            gym_count = EXCLUDED.gym_count,
            game_room_count = EXCLUDED.game_room_count,
            kitchen_count = EXCLUDED.kitchen_count,
            av_room_count = EXCLUDED.av_room_count,
            k1_space_count = EXCLUDED.k1_space_count
        `;
        result = { success: true };
        break;

      // --- PACKAGES ---
      case 'getPackages':
        result = await sql`SELECT * FROM package_records`;
        break;

      case 'savePackage':
        await sql`
          INSERT INTO package_records (id, year, month, count)
          VALUES (${body.id}, ${body.year}, ${body.month}, ${body.count})
          ON CONFLICT (id) DO UPDATE SET
            count = EXCLUDED.count
        `;
        result = { success: true };
        break;

      case 'deletePackage':
        await sql`DELETE FROM package_records WHERE id = ${body.id}`;
        result = { success: true };
        break;

      // --- AUDIT LOGS ---
      case 'getAuditLogs':
        result = await sql`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 500`;
        break;

      case 'addAuditLog':
        const log = body;
        await sql`
          INSERT INTO audit_logs (id, timestamp, actor_name, module, action, description, diff)
          VALUES (
            ${crypto.randomUUID()}, ${log.timestamp}, ${log.actorName}, 
            ${log.module}, ${log.action}, ${log.description}, ${log.diff || null}
          )
        `;
        result = { success: true };
        break;

      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ error: `Unknown action: ${action}` }),
        };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    };

  } catch (error: any) {
    console.error('Database Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
