package com.clinic.seeder;

import com.clinic.model.stock.StockProduct;
import com.clinic.repository.StockProductRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class StockSeeder implements CommandLineRunner {

    private final StockProductRepository productRepo;

    public StockSeeder(StockProductRepository productRepo) {
        this.productRepo = productRepo;
    }

    @Override
    public void run(String... args) throws Exception {
        if (productRepo.count() == 0) {
            System.out.println("Seeding Stock Products...");
            
            String[] tablets = {"Paracetamol 500mg", "Amoxicillin 500mg", "Metformin 500mg", "Amlodipine 5mg", "Atorvastatin 10mg", "Omeprazole 20mg", "Aspirin 75mg", "Azithromycin 500mg", "Cetirizine 10mg", "Pantoprazole 40mg"};
            String[] syrups = {"Paracetamol Syrup", "Benadryl Cough Syrup", "Calpol", "Amoxicillin Dry Syrup", "Cetirizine Syrup", "Lactulose Syrup"};
            String[] injections = {"Insulin", "Ceftriaxone 1g", "Dexamethasone", "Ondansetron 4mg", "Diclofenac 75mg", "Vitamin B12"};
            String[] capsules = {"Amoxicillin 500mg", "Omeprazole 20mg", "Vitamin D3 60K", "Iron + Folic Acid", "Doxycycline 100mg"};
            String[] drops = {"Otrivin Nasal Drops", "Ciprofloxacin Eye Drops", "Betadine", "Ofloxacin Ear Drops"};
            String[] ointments = {"Soframycin", "Mupirocin", "Clotrimazole", "Betamethasone"};
            
            seedCategory(tablets, "Tablet");
            seedCategory(syrups, "Syrup");
            seedCategory(injections, "Injection");
            seedCategory(capsules, "Capsule");
            seedCategory(drops, "Drops");
            seedCategory(ointments, "Ointment");
        }
    }

    private void seedCategory(String[] items, String category) {
        for (String itemName : items) {
            StockProduct p = new StockProduct();
            p.setId("PROD-" + System.currentTimeMillis() + "-" + (int)(Math.random() * 1000));
            p.setName(itemName);
            p.setCategoryType(category);
            p.setUom("Units");
            p.setPackingType("Single Unit");
            p.setMinStockLevel(10);
            productRepo.save(p);
            
            try { Thread.sleep(2); } catch (Exception e) {}
        }
    }
}
