import { defineContract, enumType, member } from '@prisma/orm-postgres/contract-builder';

const pgText = { codecId: 'pg/text@1', nativeType: 'text' } as const;

export const Role = enumType(
  'Role',
  pgText,
  member('SUPER_ADMIN', 'SUPER_ADMIN'),
  member('ADMIN', 'ADMIN'),
  member('SALES', 'SALES'),
  member('PURCHASE', 'PURCHASE'),
  member('PRODUCTION', 'PRODUCTION'),
  member('QUALITY_TESTING', 'QUALITY_TESTING'),
  member('DISPATCH', 'DISPATCH')
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

export const contract = defineContract(
  {},
  ({ field, model, rel }) => {
    const User = model('User', {
      fields: {
        id: field.id.uuidv7String(),
        name: field.text(),
        username: field.text().unique().optional(),
        email: field.text().unique(),
        password: field.text(),
        mobileNumber: field.text().optional(),
        employeeId: field.text().optional(),
        role: field.namedType(Role).default(Role.members.PRODUCTION),
        fcmToken: field.text().optional(),
        refreshToken: field.text().optional(),
        isActive: field.boolean().default(true),
        isDeleted: field.int().default(0),
        createdAt: field.temporal.createdAtString(),
        updatedAt: field.temporal.updatedAtString(),
      },
    });

    const Client = model('Client', {
      fields: {
        id: field.id.uuidv7String(),
        clientcode: field.text().unique(),
        companyName: field.text(),
        contactName: field.text().optional(),
        contactNo: field.text(),
        email: field.text().optional(),
        address: field.text().optional(),
        gstNumber: field.text().optional(),
        panNumber: field.text().optional(),
        websiteUrl: field.text().optional(),
        industry: field.text().optional(),
        remarks: field.text().optional(),
        profileImage: field.text().optional(),
        createdById: field.uuidString().optional(),
        isDeleted: field.int().default(0),
        createdAt: field.temporal.createdAtString(),
      },
    });

    const CompanyContact = model('CompanyContact', {
      fields: {
        id: field.id.uuidv7String(),
        companyId: field.uuidString(), // links to Client
        fullName: field.text(),
        designation: field.text().optional(),
        department: field.text().optional(),
        email: field.text().optional(),
        mobile: field.text().optional(),
        whatsapp: field.text().optional(),
        profileImage: field.text().optional(),
        reportsToId: field.uuidString().optional(),
        notes: field.text().optional(),
        isDeleted: field.int().default(0),
        createdAt: field.temporal.createdAtString(),
      },
    });

    const Order = model('Order', {
      fields: {
        id: field.id.uuidv7String(),
        poNumber: field.text().unique(),
        clientId: field.uuidString(),
        requirements: field.text().optional(),
        budget: field.bigint().optional(),
        createdById: field.uuidString().optional(),
        isDeleted: field.int().default(0),
        createdAt: field.temporal.createdAtString(),
        updatedAt: field.temporal.updatedAtString(),
        currentStage: field.namedType(OrderStage).default(OrderStage.members.QUOTATION),
        stageSequence: field.text().optional(),
      },
    });

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

    const StageLog = model('StageLog', {
      fields: {
        id: field.id.uuidv7String(),
        orderId: field.uuidString(),
        stage: field.namedType(OrderStage),
        changedById: field.uuidString().optional(),
        createdAt: field.temporal.createdAtString(),
      },
    });

    const Task = model('Task', {
      fields: {
        id: field.id.uuidv7String(),
        orderId: field.uuidString().optional(),
        title: field.text(),
        description: field.text().optional(),
        priority: field.namedType(Priority).default(Priority.members.MEDIUM),
        status: field.namedType(TaskStatus).default(TaskStatus.members.PENDING),
        dueDate: field.temporal.timestampString().optional(),
        assignedToId: field.uuidString().optional(),
        createdById: field.uuidString().optional(),
        isDeleted: field.int().default(0),
        createdAt: field.temporal.createdAtString(),
      },
    });

    const Drawing = model('Drawing', {
      fields: {
        id: field.id.uuidv7String(),
        orderId: field.uuidString(),
        filename: field.text(),
        fileUrl: field.text(),
        uploadedById: field.uuidString().optional(),
        createdAt: field.temporal.createdAtString(),
      },
    });

    const Note = model('Note', {
      fields: {
        id: field.id.uuidv7String(),
        orderId: field.uuidString(),
        userId: field.uuidString().optional(),
        content: field.text(),
        createdAt: field.temporal.createdAtString(),
      },
    });

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
          contacts: rel.hasMany(CompanyContact, { by: 'companyId' }),
        }),
        CompanyContact: CompanyContact.relations({
          client: rel.belongsTo(Client, { from: 'companyId', to: 'id' }),
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
