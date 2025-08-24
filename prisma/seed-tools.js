const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedTools() {
  console.log('Seeding tool categories and lists...');
  
  try {
    // Create Demo category
    const demoCategory = await prisma.toolCategory.create({
      data: {
        name: 'Demo',
        description: 'Demolition tools and equipment',
        sortOrder: 1
      }
    });
    
    // Create Install category
    const installCategory = await prisma.toolCategory.create({
      data: {
        name: 'Install',
        description: 'Installation tools and equipment',
        sortOrder: 2
      }
    });
    
    // Define tool lists and items
    const toolData = {
      Demo: {
        Kitchen: [
          { name: 'Sledgehammer (20lb)' },
          { name: 'Crowbar (36")' },
          { name: 'Reciprocating saw' },
          { name: 'Utility knife' },
          { name: 'Safety glasses' },
          { name: 'Work gloves' },
          { name: 'Dust masks' },
          { name: 'Drop cloths' },
          { name: 'Trash bags (heavy duty)' },
          { name: 'Shop vacuum' },
          { name: 'Extension cords' },
          { name: 'Work lights' }
        ],
        Bathroom: [
          { name: 'Sledgehammer (10lb)' },
          { name: 'Pry bar' },
          { name: 'Pipe wrench' },
          { name: 'Adjustable wrench' },
          { name: 'Safety glasses' },
          { name: 'Work gloves' },
          { name: 'Dust masks' },
          { name: 'Plastic sheeting' },
          { name: 'Trash bags' },
          { name: 'Bucket' },
          { name: 'Utility knife' },
          { name: 'Screwdriver set' }
        ],
        Flooring: [
          { name: 'Floor scraper' },
          { name: 'Pry bar' },
          { name: 'Hammer' },
          { name: 'Utility knife' },
          { name: 'Knee pads' },
          { name: 'Dust masks' },
          { name: 'Trash bags' },
          { name: 'Shop vacuum' },
          { name: 'Extension cords' }
        ],
        Framing: [
          { name: 'Reciprocating saw' },
          { name: 'Circular saw' },
          { name: 'Sledgehammer' },
          { name: 'Pry bar' },
          { name: 'Safety glasses' },
          { name: 'Work gloves' },
          { name: 'Dust masks' },
          { name: 'Extension cords' }
        ],
        Drywall: [
          { name: 'Drywall saw' },
          { name: 'Utility knife' },
          { name: 'Pry bar' },
          { name: 'Hammer' },
          { name: 'Dust masks' },
          { name: 'Safety glasses' },
          { name: 'Drop cloths' },
          { name: 'Trash bags' }
        ]
      },
      Install: {
        Cabinets: [
          { name: 'Drill/Driver set' },
          { name: 'Level (4ft)' },
          { name: 'Stud finder' },
          { name: 'Tape measure' },
          { name: 'Cabinet jacks' },
          { name: 'Clamps' },
          { name: 'Hole saw kit' },
          { name: 'Jigsaw' },
          { name: 'Cabinet hardware jig' },
          { name: 'Shims' },
          { name: 'Safety glasses' },
          { name: 'Touch-up markers' }
        ],
        Drywall: [
          { name: 'Drywall lift' },
          { name: 'Screw gun' },
          { name: 'Drywall saw' },
          { name: 'T-square (4ft)' },
          { name: 'Utility knife' },
          { name: 'Tape measure' },
          { name: 'Mud pan' },
          { name: 'Taping knives (6", 10", 12")' },
          { name: 'Corner tool' },
          { name: 'Sanding pole' },
          { name: 'Dust masks' },
          { name: 'Work lights' }
        ],
        Flooring: [
          { name: 'Flooring nailer' },
          { name: 'Miter saw' },
          { name: 'Jigsaw' },
          { name: 'Tape measure' },
          { name: 'Chalk line' },
          { name: 'Knee pads' },
          { name: 'Tapping block' },
          { name: 'Pull bar' },
          { name: 'Spacers' },
          { name: 'Moisture meter' },
          { name: 'Level' },
          { name: 'Underlayment' }
        ],
        Framing: [
          { name: 'Framing hammer' },
          { name: 'Circular saw' },
          { name: 'Speed square' },
          { name: 'Level (4ft)' },
          { name: 'Tape measure (25ft)' },
          { name: 'Chalk line' },
          { name: 'Nail gun' },
          { name: 'Sawhorses' },
          { name: 'String line' },
          { name: 'Safety glasses' },
          { name: 'Tool belt' },
          { name: 'Extension cords' }
        ],
        Decking: [
          { name: 'Circular saw' },
          { name: 'Miter saw' },
          { name: 'Drill/Driver set' },
          { name: 'Level (4ft)' },
          { name: 'Tape measure (25ft)' },
          { name: 'Chalk line' },
          { name: 'Speed square' },
          { name: 'Post hole digger' },
          { name: 'String line' },
          { name: 'Deck board spacers' },
          { name: 'Work gloves' },
          { name: 'Hidden fastener tool' }
        ],
        Painting: [
          { name: 'Drop cloths' },
          { name: 'Painters tape' },
          { name: 'Brushes (various sizes)' },
          { name: 'Rollers and covers' },
          { name: 'Paint trays' },
          { name: 'Extension pole' },
          { name: 'Putty knife' },
          { name: 'Sandpaper' },
          { name: 'Primer' },
          { name: 'Ladder' },
          { name: 'Paint can opener' },
          { name: 'Rags' }
        ]
      }
    };
    
    // Create tool lists and items
    for (const [categoryName, lists] of Object.entries(toolData)) {
      const category = categoryName === 'Demo' ? demoCategory : installCategory;
      let listOrder = 0;
      
      for (const [listName, items] of Object.entries(lists)) {
        // Create tool list
        const toolList = await prisma.toolList.create({
          data: {
            categoryId: category.id,
            name: listName,
            isProtected: true, // These are the default lists
            sortOrder: listOrder++
          }
        });
        
        // Create tool items
        let itemOrder = 0;
        for (const item of items) {
          await prisma.toolItem.create({
            data: {
              listId: toolList.id,
              name: item.name,
              isChecked: false,
              sortOrder: itemOrder++
            }
          });
        }
        
        console.log(`Created ${listName} list with ${items.length} items`);
      }
    }
    
    console.log('Tool seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding tools:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedTools().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});