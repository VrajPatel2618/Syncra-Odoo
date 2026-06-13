const fs = require('fs');
let content = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

// 1. Change provider
content = content.replace('provider = "postgresql"', 'provider = "sqlite"');

// 2. Remove enums
content = content.replace(/enum\s+\w+\s*\{[\s\S]*?\}/g, '');

// 3. Update enum types to String and add quotes to defaults
content = content.replace(/role(\s+)UserRole(\s+)@default\(VIEWER\)/g, 'role$1String$2@default("VIEWER")');
content = content.replace(/procurementStrategy(\s+)ProcurementStrategy(\s+)@default\(MTS\)/g, 'procurementStrategy$1String$2@default("MTS")');
content = content.replace(/status(\s+)OrderStatus(\s+)@default\(DRAFT\)/g, 'status$1String$2@default("DRAFT")');
content = content.replace(/status(\s+)PurchaseStatus(\s+)@default\(DRAFT\)/g, 'status$1String$2@default("DRAFT")');
content = content.replace(/status(\s+)ManufacturingStatus(\s+)@default\(DRAFT\)/g, 'status$1String$2@default("DRAFT")');
content = content.replace(/status(\s+)WorkOrderStatus(\s+)@default\(PENDING\)/g, 'status$1String$2@default("PENDING")');
content = content.replace(/movementType(\s+)MovementType/g, 'movementType$1String');
content = content.replace(/type(\s+)NotificationType/g, 'type$1String');

// 4. Update Json to String
content = content.replace(/permissions(\s+)Json/g, 'permissions$1String');
content = content.replace(/zones(\s+)Json\?/g, 'zones$1String?');
content = content.replace(/previousValue(\s+)Json\?/g, 'previousValue$1String?');
content = content.replace(/newValue(\s+)Json\?/g, 'newValue$1String?');
content = content.replace(/parameters(\s+)Json\?/g, 'parameters$1String?');

// 5. Remove @db.Decimal(12, 2)
content = content.replace(/@db\.Decimal\(12, 2\)/g, '');

fs.writeFileSync('backend/prisma/schema.prisma', content);
console.log('Schema updated successfully');
