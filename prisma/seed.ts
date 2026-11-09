import { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const categories = [
  ["Cà phê Arabica", "ca-phe-arabica"],
  ["Cà phê Robusta", "ca-phe-robusta"],
  ["Cà phê Blend", "ca-phe-blend"],
  ["Cà phê rang xay", "ca-phe-rang-xay"],
  ["Cà phê hạt nguyên chất", "ca-phe-hat-nguyen-chat"],
  ["Cà phê Specialty", "ca-phe-specialty"],
  ["Cà phê pha phin", "ca-phe-pha-phin"],
  ["Cà phê pha máy", "ca-phe-pha-may"],
  ["Combo cà phê", "combo-ca-phe"],
  ["Quà tặng cà phê", "qua-tang-ca-phe"],
] as const;

const products = [
  {
    name: "Cà phê Arabica Đắk Lắk", slug: "ca-phe-arabica-dak-lak", sku: "BN-ARA-DL",
    shortDescription: "Thanh tao, hậu ngọt dịu và chút chua trái cây thanh.",
    description: "Arabica Đắk Lắk được chọn từ những mẻ hạt đạt chuẩn, rang vừa để giữ độ chua dịu, hương caramel và hậu vị ngọt sạch. Phù hợp cho những buổi sáng chậm rãi và người quen uống cà phê ít đắng.",
    story: "Từ những vườn cà phê trên cao nguyên bazan, từng trái chín được thu hái chọn lọc rồi sơ chế trong ngày. Beanora rang theo mẻ nhỏ để kiểm soát nhiệt độ, giữ lại bản sắc dịu nhẹ của Arabica vùng đất Tây Nguyên.",
    origin: "Việt Nam", region: "Đắk Lắk, Tây Nguyên", altitude: "600–900 m", flavor: "Caramel, trái cây chín, hậu ngọt", roastLevel: "Medium", process: "Sơ chế ướt", brewMethods: "Phin, Pour-over, French Press", storage: "Đậy kín, nơi khô mát; dùng tốt nhất trong 30 ngày sau khi mở.",
    price: 189000, compareAt: 239000, image: "/images/arabica-dak-lak.jpg", badge: "Bán chạy", featured: true, bestseller: true, isNew: false, cats: [0, 3, 4, 6], stock: 86,
  },
  {
    name: "Cà phê Robusta Buôn Ma Thuột", slug: "ca-phe-robusta-buon-ma-thuot", sku: "BN-ROB-BMT",
    shortDescription: "Đậm đà, mạnh mẽ, hương cacao và hậu vị bền.",
    description: "Robusta Buôn Ma Thuột có thân vị dày, độ đắng tròn và caffeine rõ rệt. Mẻ rang hướng tới sự cân bằng để hạt Robusta thể hiện hương cacao, mật và chút khói nhẹ mà không gắt.",
    story: "Những hạt Robusta chín mọng từ vùng đất đỏ bazan được phơi và sơ chế cẩn thận. Beanora chọn biểu đồ rang vừa–đậm, kéo dài giai đoạn phát triển hương để vị cà phê đậm nhưng vẫn sạch và ngọt hậu.",
    origin: "Việt Nam", region: "Buôn Ma Thuột, Đắk Lắk", altitude: "500–800 m", flavor: "Cacao đen, mật, hậu vị bền", roastLevel: "Medium-Dark", process: "Sơ chế tự nhiên", brewMethods: "Phin, Moka Pot, Espresso", storage: "Đậy kín, tránh nắng và nhiệt; không bảo quản ngăn đá.",
    price: 149000, compareAt: 179000, image: "/images/robusta-buon-ma-thuot.jpg", badge: "Giảm 17%", featured: true, bestseller: true, isNew: false, cats: [1, 3, 4, 6, 7], stock: 112,
  },
  {
    name: "Cà phê Blend Signature", slug: "ca-phe-blend-signature", sku: "BN-BLD-SIG",
    shortDescription: "Cân bằng giữa thơm nhẹ, vị đậm và hậu ngọt kéo dài.",
    description: "Signature là công thức phối trộn dành cho tách cà phê Việt hiện đại: đủ đậm để uống với sữa, đủ thơm để thưởng thức đen. Vị cà phê tròn, ít gắt và dễ pha ổn định tại nhà.",
    story: "Beanora thử nghiệm nhiều tỷ lệ Arabica và Robusta qua từng mẻ cupping trước khi chọn công thức Signature. Mỗi thành phần được rang riêng rồi phối trộn, giúp hương vị đồng đều và tôn ưu điểm của từng giống hạt.",
    origin: "Việt Nam", region: "Đắk Lắk & Lâm Đồng", altitude: "600–1.500 m", flavor: "Cacao, caramel, chút hạt nâu", roastLevel: "Medium", process: "Phối trộn sau rang", brewMethods: "Phin, Espresso, Cold Brew", storage: "Đậy kín sau mỗi lần dùng; xay trước khi pha để thơm nhất.",
    price: 189000, compareAt: null, image: "/images/blend-signature.jpg", badge: "Signature", featured: true, bestseller: true, isNew: false, cats: [2, 3, 6, 7], stock: 74,
  },
  {
    name: "Cà phê Specialty Cầu Đất", slug: "ca-phe-specialty-cau-dat", sku: "BN-SPC-CD",
    shortDescription: "Sáng hương, chua thanh và nhiều lớp vị trái cây.",
    description: "Một lô Arabica chọn lọc từ Cầu Đất cho người muốn khám phá cà phê theo cách chậm hơn. Hương hoa nhẹ, chua trái cây sống động và hậu vị trà, thích hợp pha thủ công.",
    story: "Từng mẻ Specialty bắt đầu bằng việc chọn trái chín và kiểm soát lên men. Tại xưởng, Beanora rang nhẹ theo mẻ nhỏ, nghỉ hạt đúng thời gian rồi mới đóng gói để hương vị mở ra trọn vẹn trong tách phin hoặc pour-over.",
    origin: "Việt Nam", region: "Cầu Đất, Lâm Đồng", altitude: "1.450–1.600 m", flavor: "Hoa trắng, cam quýt, trà đen", roastLevel: "Light-Medium", process: "Sơ chế ướt", brewMethods: "Pour-over, Aeropress, Phin giấy", storage: "Đậy kín, dùng trong 21–30 ngày sau khi mở để giữ hương.",
    price: 249000, compareAt: null, image: "/images/specialty-cau-dat.jpg", badge: "Mới", featured: true, bestseller: false, isNew: true, cats: [0, 4, 5], stock: 42,
  },
  {
    name: "Cà phê Pha Phin Truyền Thống", slug: "ca-phe-pha-phin-truyen-thong", sku: "BN-PHIN-TT",
    shortDescription: "Đậm chất phin Việt, thơm cacao và hậu vị êm.",
    description: "Công thức dành riêng cho chiếc phin quen thuộc. Cà phê nhỏ giọt chậm, màu nâu sẫm, vị đậm nhưng không cháy gắt; uống đen đã ngon, thêm sữa đặc càng tròn vị.",
    story: "Beanora gìn giữ trải nghiệm phin Việt bằng cách chọn hạt có thân vị tốt và rang đủ chín tới. Độ xay khuyến nghị được kiểm thử với phin 4–6 phút để ly cà phê đậm đà mà vẫn dễ uống mỗi ngày.",
    origin: "Việt Nam", region: "Tây Nguyên", altitude: "500–900 m", flavor: "Cacao, khói nhẹ, hậu ngọt", roastLevel: "Dark", process: "Sơ chế tự nhiên", brewMethods: "Phin truyền thống", storage: "Đậy kín, nơi khô mát; không để gần thực phẩm mùi mạnh.",
    price: 129000, compareAt: 159000, image: "/images/phin-truyen-thong.jpg", badge: "Giá tốt", featured: true, bestseller: true, isNew: false, cats: [1, 2, 3, 6], stock: 128,
  },
  {
    name: "Arabica Cầu Đất Honey", slug: "arabica-cau-dat-honey", sku: "BN-ARA-HON",
    shortDescription: "Ngọt mật, chua dịu và hương trái cây vàng.",
    description: "Arabica sơ chế mật giữ lại một phần thịt quả trong quá trình phơi, tạo cảm giác ngọt tự nhiên và thân vị mềm. Thích hợp pour-over hoặc phin giấy.",
    story: "Sau thu hái, trái cà phê được tách vỏ nhưng vẫn giữ lớp nhầy ngọt bao quanh hạt. Quá trình phơi được theo dõi sát để hạt lên hương mật và trái cây mà không xuất hiện vị lên men gắt.",
    origin: "Việt Nam", region: "Cầu Đất, Lâm Đồng", altitude: "1.500 m", flavor: "Mật ong, mơ chín, đường nâu", roastLevel: "Medium-Light", process: "Honey", brewMethods: "Pour-over, Aeropress", storage: "Đậy kín, khô mát; xay ngay trước khi pha.",
    price: 229000, compareAt: null, image: "/images/arabica-cau-dat.jpg", badge: "Vùng trồng", featured: false, bestseller: false, isNew: true, cats: [0, 4, 5], stock: 36,
  },
  {
    name: "Robusta Honey Đắk Nông", slug: "robusta-honey-dak-nong", sku: "BN-ROB-HON",
    shortDescription: "Robusta ngọt hậu, thân dày và ít gắt.",
    description: "Một góc nhìn khác về Robusta: vẫn đậm và giàu năng lượng nhưng mềm hơn nhờ sơ chế mật. Hợp với phin đen, cà phê sữa và moka pot.",
    story: "Lớp nhầy tự nhiên được giữ lại trong quá trình phơi tạo nên độ ngọt và thân vị đặc trưng. Beanora rang theo mẻ nhỏ để kiểm soát vị đắng và giữ hậu vị sạch.",
    origin: "Việt Nam", region: "Đắk Nông", altitude: "700–900 m", flavor: "Mật, cacao, hạt nâu", roastLevel: "Medium", process: "Honey", brewMethods: "Phin, Moka Pot", storage: "Đậy kín, tránh ẩm và ánh nắng trực tiếp.",
    price: 179000, compareAt: null, image: "/images/robusta-honey.jpg", badge: "Mới", featured: false, bestseller: false, isNew: true, cats: [1, 4, 6], stock: 51,
  },
  {
    name: "Cold Brew Blend", slug: "cold-brew-blend", sku: "BN-CLD-BLD",
    shortDescription: "Ngọt mát, ít chua, hương cacao và trái cây khô.",
    description: "Công thức tối ưu cho ủ lạnh 12–16 giờ. Hạt được chọn và rang để chiết xuất dịu, ít chát, thích hợp uống đá hoặc kết hợp nước cốt dừa.",
    story: "Beanora điều chỉnh tỷ lệ phối trộn và độ xay thô qua nhiều lần ủ thử. Kết quả là một ly cold brew sạch vị, dễ làm tại nhà mà không cần công thức phức tạp.",
    origin: "Việt Nam", region: "Tây Nguyên & Lâm Đồng", altitude: null, flavor: "Cacao, trái cây khô, hậu ngọt", roastLevel: "Medium", process: "Phối trộn", brewMethods: "Cold Brew, French Press", storage: "Đậy kín; cà phê ủ lạnh dùng trong 48 giờ trong tủ lạnh.",
    price: 169000, compareAt: null, image: "/images/cold-brew.jpg", badge: null, featured: false, bestseller: false, isNew: true, cats: [2, 3, 7], stock: 63,
  },
  {
    name: "Combo Khám Phá Beanora", slug: "combo-kham-pha-beanora", sku: "BN-COMBO-KP",
    shortDescription: "Ba phong vị, một hành trình khám phá cà phê Việt.",
    description: "Combo gồm Arabica Đắk Lắk, Robusta Buôn Ma Thuột và Blend Signature. Một lựa chọn tiện lợi để so sánh phong vị hoặc tìm loại cà phê hợp gu.",
    story: "Hành trình cà phê nên bắt đầu bằng sự tò mò. Beanora chọn ba công thức tiêu biểu, đóng gói cùng hướng dẫn pha để bạn có thể thử, ghi chú và tìm ra tách cà phê của riêng mình.",
    origin: "Việt Nam", region: "Tây Nguyên & Lâm Đồng", altitude: null, flavor: "Ba phong vị từ thanh nhẹ đến đậm đà", roastLevel: "Đa dạng", process: "Bộ sưu tập", brewMethods: "Phin, Pour-over, Espresso", storage: "Đậy kín từng gói sau khi mở.",
    price: 399000, compareAt: 477000, image: "/images/combo-kham-pha.jpg", badge: "Tiết kiệm 16%", featured: true, bestseller: false, isNew: false, cats: [8], stock: 28,
  },
  {
    name: "Hộp Quà Cà Phê Việt", slug: "hop-qua-ca-phe-viet", sku: "BN-GIFT-VN",
    shortDescription: "Một món quà ấm áp cho người yêu cà phê Việt.",
    description: "Hộp quà gồm cà phê Signature, phin pha và thiệp hướng dẫn. Thiết kế gọn đẹp, thích hợp làm quà cảm ơn, quà đối tác hoặc món quà cho một buổi sáng đặc biệt.",
    story: "Beanora gói trọn tinh thần cà phê Việt trong một hộp quà tối giản: hạt cà phê được rang theo mẻ, chiếc phin quen thuộc và lời nhắn hãy dành thời gian thưởng thức thật chậm.",
    origin: "Việt Nam", region: "Tây Nguyên", altitude: null, flavor: "Cân bằng, cacao, caramel", roastLevel: "Medium", process: "Bộ quà tặng", brewMethods: "Phin", storage: "Bảo quản cà phê kín, khô mát.",
    price: 549000, compareAt: null, image: "/images/blend-signature.jpg", badge: "Quà tặng", featured: false, bestseller: false, isNew: false, cats: [9], stock: 18,
  },
];

async function main() {
  const roleData = [
    ["SUPER_ADMIN", "Super Admin", "Toàn quyền hệ thống"],
    ["ADMIN", "Quản trị viên", "Quản trị vận hành"],
    ["ORDER_MANAGER", "Quản lý đơn hàng", "Xử lý đơn và thanh toán"],
    ["PRODUCT_MANAGER", "Quản lý sản phẩm", "Quản lý danh mục"],
    ["SUPPORT", "Chăm sóc khách hàng", "Hỗ trợ khách hàng"],
    ["WAREHOUSE", "Nhân viên kho", "Quản lý tồn kho"],
  ];
  for (const [code, name, description] of roleData) {
    await prisma.role.upsert({ where: { code }, update: { name, description }, create: { code, name, description } });
  }

  const permissions = ["dashboard:read", "products:write", "orders:write", "payments:verify", "customers:write", "inventory:write", "settings:write", "staff:write"];
  for (const code of permissions) {
    await prisma.permission.upsert({ where: { code }, update: {}, create: { code, name: code } });
  }
  const superRole = await prisma.role.findUniqueOrThrow({ where: { code: "SUPER_ADMIN" } });
  const allPermissions = await prisma.permission.findMany();
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superRole.id, permissionId: permission.id } },
      update: {}, create: { roleId: superRole.id, permissionId: permission.id },
    });
  }
  const rolePermissionMap: Record<string, string[]> = {
    ADMIN: permissions.filter((code) => code !== "staff:write"),
    ORDER_MANAGER: ["dashboard:read", "orders:write", "payments:verify"],
    PRODUCT_MANAGER: ["dashboard:read", "products:write", "inventory:write"],
    SUPPORT: ["dashboard:read", "customers:write"],
    WAREHOUSE: ["dashboard:read", "inventory:write"],
  };
  for (const [roleCode, codes] of Object.entries(rolePermissionMap)) {
    const role = await prisma.role.findUniqueOrThrow({ where: { code: roleCode } });
    for (const code of codes) {
      const permission = allPermissions.find((item) => item.code === code)!;
      await prisma.rolePermission.upsert({ where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } }, update: {}, create: { roleId: role.id, permissionId: permission.id } });
    }
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@beanora.vn";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Beanora@2026";
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { name: "Quản trị Beanora", email: adminEmail, passwordHash, emailVerifiedAt: new Date() },
  });
  await prisma.userRole.upsert({ where: { userId_roleId: { userId: admin.id, roleId: superRole.id } }, update: {}, create: { userId: admin.id, roleId: superRole.id } });

  if (process.env.SEED_ADMIN_ONLY === "true") {
    await prisma.paymentSetting.upsert({ where: { id: "default" }, update: {}, create: { id: "default", codEnabled: true, bankEnabled: false } });
    console.log(`Seed Super Admin hoàn tất cho ${adminEmail}; không tạo catalog mẫu. Hãy đổi mật khẩu sau đăng nhập.`);
    return;
  }

  const categoryRecords: Array<{ id: string }> = [];
  for (let i = 0; i < categories.length; i++) {
    const [name, slug] = categories[i];
    categoryRecords.push(await prisma.category.upsert({ where: { slug }, update: { name, position: i }, create: { name, slug, position: i } }));
  }

  for (const item of products) {
    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name, shortDescription: item.shortDescription, description: item.description, story: item.story,
        origin: item.origin, region: item.region, altitude: item.altitude, flavor: item.flavor, roastLevel: item.roastLevel,
        process: item.process, brewMethods: item.brewMethods, storage: item.storage, badge: item.badge,
        featured: item.featured, bestseller: item.bestseller, isNew: item.isNew, active: true,
      },
      create: {
        name: item.name, slug: item.slug, sku: item.sku, shortDescription: item.shortDescription,
        description: item.description, story: item.story, origin: item.origin, region: item.region, altitude: item.altitude,
        flavor: item.flavor, roastLevel: item.roastLevel, process: item.process, brewMethods: item.brewMethods,
        storage: item.storage, badge: item.badge, featured: item.featured, bestseller: item.bestseller, isNew: item.isNew,
      },
    });
    await prisma.productCategory.deleteMany({ where: { productId: product.id } });
    await prisma.productCategory.createMany({ data: item.cats.map((index) => ({ productId: product.id, categoryId: categoryRecords[index].id })) });
    const existingImage = await prisma.productImage.findFirst({ where: { productId: product.id } });
    if (existingImage) await prisma.productImage.update({ where: { id: existingImage.id }, data: { url: item.image, alt: item.name } });
    else await prisma.productImage.create({ data: { productId: product.id, url: item.image, alt: item.name } });

    const variants = [];
    for (const [weight, multiplier] of [["250g", 0.6], ["500g", 1], ["1kg", 1.85]] as const) {
      for (const [grind, grindCode] of [["Nguyên hạt", "WB"], ["Xay phin", "GF"]] as const) {
        variants.push({
          name: `${weight} · ${grind}`, sku: `${item.sku}-${weight === "1kg" ? "1K" : weight.replace("g", "")}-${grindCode}`,
          weight, roast: item.roastLevel, grind,
          price: Math.round((item.compareAt || item.price) * multiplier / 1000) * 1000,
          salePrice: item.compareAt ? Math.round(item.price * multiplier / 1000) * 1000 : null,
        });
      }
    }
    for (const variant of variants) {
      const record = await prisma.productVariant.upsert({ where: { sku: variant.sku }, update: { ...variant, productId: product.id }, create: { ...variant, productId: product.id } });
      await prisma.inventory.upsert({ where: { variantId: record.id }, update: {}, create: { variantId: record.id, quantity: item.stock, reorderPoint: 15 } });
    }
  }

  await prisma.paymentSetting.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", codEnabled: true, bankEnabled: false, instructions: "Vui lòng chuyển đúng số tiền và ghi mã đơn hàng vào nội dung chuyển khoản. Giao dịch chỉ được ghi nhận sau khi cửa hàng đối chiếu thực tế." },
  });

  await prisma.coupon.upsert({
    where: { code: "BEANORA10" },
    update: {},
    create: { code: "BEANORA10", type: "PERCENT", value: 10, minimumOrder: 300000, maxDiscount: 100000, usageLimit: 1000, startsAt: new Date("2026-01-01"), endsAt: new Date("2027-12-31") },
  });

  const settings: Array<[string, Prisma.InputJsonValue]> = [
    ["brand", { name: "Beanora", slogan: "Tinh hoa cà phê Việt", tagline: "More than coffee — It’s a lifestyle", description: "Hương vị thuần khiết từ những hạt cà phê chất lượng nhất." }],
    ["contact", { address: "Biên Hòa, Đồng Nai, Việt Nam", phone: "", email: "hello@beanora.vn", social: {} }],
    ["business", { storeName: "Beanora Coffee", address: "Biên Hòa, Đồng Nai, Việt Nam", phone: "", email: "hello@beanora.vn" }],
  ];
  for (const [key, value] of settings) {
    await prisma.siteSetting.upsert({ where: { key }, update: {}, create: { key, value } });
  }

  const posts = [
    { title: "Arabica và Robusta: Chọn hạt nào cho tách cà phê của bạn?", slug: "arabica-va-robusta-chon-hat-nao", excerpt: "Hiểu khác biệt về hương, vị và caffeine để chọn cà phê hợp gu mỗi ngày.", content: "Arabica thường có chua thanh, hương thơm nhiều lớp và vị nhẹ hơn. Robusta có thân vị dày, đắng rõ và hàm lượng caffeine cao hơn. Nếu bạn thích pour-over hoặc cà phê đen ít đắng, hãy bắt đầu với Arabica. Nếu bạn yêu phin đậm hoặc cà phê sữa, Robusta và Blend là lựa chọn đáng thử. Không có hạt tốt nhất cho tất cả mọi người chỉ có hạt phù hợp nhất với khẩu vị và cách pha của bạn.", coverUrl: "/images/arabica-dak-lak.jpg" },
    { title: "Pha phin 4–6 phút: Nền tảng cho ly cà phê cân bằng", slug: "pha-phin-4-6-phut", excerpt: "Tỷ lệ, độ xay và nhiệt độ nước cho một ly phin đậm nhưng không gắt.", content: "Bắt đầu với 20 g cà phê và 120 ml nước ở khoảng 92–96°C. Tráng phin, cho cà phê vào và lắc đều. Dùng khoảng 40 ml nước để ủ 30 giây, sau đó rót phần nước còn lại. Nếu cà phê chảy quá nhanh và vị nhạt, điều chỉnh xay mịn hơn. Nếu chảy quá chậm và vị đắng chát, thử xay thô hơn. Thay đổi một yếu tố tại một thời điểm để dễ kiểm soát.", coverUrl: "/images/phin-truyen-thong.jpg" },
    { title: "Độ rang thay đổi hương vị cà phê như thế nào?", slug: "do-rang-thay-doi-huong-vi-ca-phe", excerpt: "Rang sáng, rang vừa hay rang đậm — đâu là lựa chọn dành cho bạn?", content: "Rang sáng thường giữ nhiều đặc trưng vùng trồng, chua sáng và hương hoa trái cây. Rang vừa tạo sự cân bằng giữa chua, ngọt và đắng, phù hợp nhiều cách pha. Rang đậm làm nổi bật thân vị, cacao và vị đắng, thường hợp phin hoặc cà phê sữa. Hãy chọn độ rang theo trải nghiệm bạn mong muốn, không chỉ theo quan niệm cà phê càng đậm càng mạnh.", coverUrl: "/images/hero-coffee.jpg" },
  ];
  for (const post of posts) {
    await prisma.blogPost.upsert({ where: { slug: post.slug }, update: {}, create: { ...post, published: true, publishedAt: new Date() } });
  }

  console.log(`Seed hoàn tất. Admin local: ${adminEmail} / ${adminPassword}`);
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => prisma.$disconnect());
