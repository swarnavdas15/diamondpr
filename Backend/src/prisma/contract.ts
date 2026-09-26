import { defineContract, enumType, member } from '@prisma/orm-postgres/contract-builder';

// ======================================
// ENUMS DEFINITION
// ======================================

const pgText = { codecId: 'pg/text@1', nativeType: 'text' } as const;

export const Role = enumType(
  'Role',
  pgText,
  member('SUPER_ADMIN', 'SUPER_ADMIN'),
  member('ADMIN', 'ADMIN'),
  member('SALES', 'SALES'),
  member('PURCHASE', 'PURCHASE'),
  member('PRODUCTION', 'PRODUCTION'),
  member('TESTING', 'TESTING')
);

export const OrderStage = enumType(
  'OrderStage',
  pgText,
  member('QUOTATION', 'QUOTATION'),
  member('PURCHASE', 'PURCHASE'),
  member('CUTTING', 'CUTTING'),
  member('FORGING', 'FORGING'),
  member('MACHINING', 'MACHINING'),
  member('HEAT_TREATMENT', 'HEAT_TREATMENT'),
  member('TESTING', 'TESTING'),
  member('DISPATCH', 'DISPATCH'),
  member('COMPLETED', 'COMPLETED')
);

export const Priority = enumType(
  'Priority',
  pgText,
  member('LOW', 'LOW'),
  member('MEDIUM', 'MEDIUM'),
  member('HIGH', 'HIGH'),
  member('URGENT', 'URGENT')
);

export const TaskStatus = enumType(
  'TaskStatus',
  pgText,
  member('PENDING', 'PENDING'),
  member('IN_PROGRESS', 'IN_PROGRESS'),
  member('COMPLETED', 'COMPLETED')
);

// ======================================
// CONTRACT DEFINITION
// ======================================

export const contract = defineContract(
  {},
  ({ field, model, rel }) => {
    // 1. User Model
    const User = model('User', {
      fields: {
        id: field.id.uuidv7String(),
        name: field.text(),
        email: field.text().unique(),
        password: field.text(),
        role: field.namedType(Role).default(Role.members.PRODUCTION),
        fcmToken: field.text().optional(),
        refreshToken: field.text().optional(),
        isDeleted: field.int().default(0),
        createdAt: field.temporal.createdAtString(),
        updatedAt: field.temporal.updatedAtString(),
      },
    });

    // 2. Client Model
    const Client = model('Client', {
      fields: {
        id: field.id.uuidv7String(),
        clientcode: field.text().unique(),
        companyName: field.text(),
        gstNumber: field.text().optional(),
        contactNo: field.text(),
        email: field.text().optional(),
        address: field.text().optional(),
        createdById: field.uuidString(),
        createdAt: field.temporal.createdAtString(),
      },
    });

    // 3. Order Model
    const Order = model('Order', {
      fields: {
        id: field.id.uuidv7String(),
        poNumber: field.text().unique(),
        clientId: field.uuidString(),
        requirements: field.text(),
        stageSequence: field.text(),
        budget: field.bigint().optional(),
        createdById: field.uuidString(),
        isDeleted: field.int().default(0),
        createdAt: field.temporal.createdAtString(),
        updatedAt: field.temporal.updatedAtString(),
        currentStage: field.namedType(OrderStage).default(OrderStage.members.QUOTATION),
      },
    });

    // 4. OrderItem Model
    const OrderItem = model('OrderItem', {
      fields: {
        id: field.id.uuidv7String(),
        orderId: field.uuidString(),
        itemName: field.text(),
        size: field.text(),
        quantity: field.int(),
        unitPrice: field.bigint().optional(),
      },
    });

    // 5. StageLog Model
    const StageLog = model('StageLog', {
      fields: {
        id: field.id.uuidv7String(),
        orderId: field.uuidString(),
        stage: field.namedType(OrderStage),
        changedById: field.uuidString(),
        createdAt: field.temporal.createdAtString(),
      },
    });

    // 6. Task Model
    const Task = model('Task', {
      fields: {
        id: field.id.uuidv7String(),
        orderId: field.uuidString(),
        title: field.text(),
        description: field.text().optional(),
        priority: field.namedType(Priority).default(Priority.members.MEDIUM),
        status: field.namedType(TaskStatus).default(TaskStatus.members.PENDING),
        dueDate: field.temporal.timestampString().optional(),
        assignedToId: field.uuidString(),
        createdById: field.uuidString(),
        createdAt: field.temporal.createdAtString(),
      },
    });

    // 7. Drawing Model
    const Drawing = model('Drawing', {
      fields: {
        id: field.id.uuidv7String(),
        orderId: field.uuidString(),
        filename: field.text(),
        fileUrl: field.text(),
        uploadedById: field.uuidString(),
        createdAt: field.temporal.createdAtString(),
      },
    });

    // 8. Note Model
    const Note = model('Note', {
      fields: {
        id: field.id.uuidv7String(),
        orderId: field.uuidString(),
        userId: field.uuidString(),
        content: field.text(),
        createdAt: field.temporal.createdAtString(),
      },
    });

    // RETURN ENUMS AND MODEL RELATIONS
    return {
      enums: { Role, OrderStage, Priority, TaskStatus },
      models: {
        User: User.relations({
          createdClients: rel.hasMany(Client, { by: 'createdById' }),
          createdOrders: rel.hasMany(Order, { by: 'createdById' }),
          assignedTasks: rel.hasMany(Task, { by: 'assignedToId' }),
          createdTasks: rel.hasMany(Task, { by: 'createdById' }),
          drawings: rel.hasMany(Drawing, { by: 'uploadedById' }),
          notes: rel.hasMany(Note, { by: 'userId' }),
          stageLogs: rel.hasMany(StageLog, { by: 'changedById' }),
        }),
        Client: Client.relations({
          createdBy: rel.belongsTo(User, { from: 'createdById', to: 'id' }),
          orders: rel.hasMany(Order, { by: 'clientId' }),
        }),
        Order: Order.relations({
          client: rel.belongsTo(Client, { from: 'clientId', to: 'id' }),
          createdBy: rel.belongsTo(User, { from: 'createdById', to: 'id' }),
          items: rel.hasMany(OrderItem, { by: 'orderId' }),
          tasks: rel.hasMany(Task, { by: 'orderId' }),
          drawings: rel.hasMany(Drawing, { by: 'orderId' }),
          notes: rel.hasMany(Note, { by: 'orderId' }),
          stageLogs: rel.hasMany(StageLog, { by: 'orderId' }),
        }),
        OrderItem: OrderItem.relations({
          order: rel.belongsTo(Order, { from: 'orderId', to: 'id' }),
        }),
        StageLog: StageLog.relations({
          order: rel.belongsTo(Order, { from: 'orderId', to: 'id' }),
          changedBy: rel.belongsTo(User, { from: 'changedById', to: 'id' }),
        }),
        Task: Task.relations({
          order: rel.belongsTo(Order, { from: 'orderId', to: 'id' }),
          assignedTo: rel.belongsTo(User, { from: 'assignedToId', to: 'id' }),
          createdBy: rel.belongsTo(User, { from: 'createdById', to: 'id' }),
        }),
        Drawing: Drawing.relations({
          order: rel.belongsTo(Order, { from: 'orderId', to: 'id' }),
          uploadedBy: rel.belongsTo(User, { from: 'uploadedById', to: 'id' }),
        }),
        Note: Note.relations({
          order: rel.belongsTo(Order, { from: 'orderId', to: 'id' }),
          user: rel.belongsTo(User, { from: 'userId', to: 'id' }),
        }),
      },
    };
  }
);
