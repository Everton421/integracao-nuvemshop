import { Router } from "express";
import 'dotenv/config';
import { ConfigController } from "../modules/config/controller/config-controller.ts";
import { ConfigIntegrationRepository } from "../modules/config-integration/config-integration-repository.ts";
import { conn2, database_api } from "../database/database-connection.ts";
import { ProductController } from "../modules/products/product-controller.ts";
import { InventoryController } from "../modules/inventory/controller/inventory-controller.ts";
import { CategoryController } from "../modules/categories/controller/category-controller.ts";
import { PedidoController } from "../modules/orders/controller/pedido-controller.ts";
const router = Router();



router.get('/', async (req, res) => {
    const configIntegrationRepository = new ConfigIntegrationRepository(conn2, database_api);
    const data = await configIntegrationRepository.findAll();
    res.render('index', 
        { dados: data[0] }
    );
})

const categoryController = new CategoryController();

router.get('/categorias', (req, res) => categoryController.list(req, res));
router.post('/api/categorias', (req, res) => categoryController.sendSelected(req, res));

const pedidoController = new PedidoController();

router.get('/pedidos', (req, res) => pedidoController.list(req, res));
router.post('/api/pedidos/sync-manual', (req, res) => pedidoController.syncManual(req, res));

router.post('/post-estoque', new InventoryController().postStock );
router.post('/post-preco', new InventoryController().postPrice);

/**
 * Modulo config: configuracoes registradas pelo usuario para cada modulo.
 */
const configController = new ConfigController()

router.get('/config', (req, res) => configController.index(req, res))
router.post('/api/config/:modulo', (req, res) => configController.save(req, res))

 router.get('/produtos', new ProductController().listProducts)

 router.post('/post-products', new ProductController().syncProduct);
export { router };


