import { conn2, database_api } from "./database-connection.ts";
 
export async function seed(){
    const database_integration =  database_api ;

      const tables = [
        `CREATE DATABASE IF NOT EXISTS ${database_integration};`,

     `CREATE TABLE IF NOT EXISTS ${database_integration}.categorias  (
           id  int(11) NOT NULL AUTO_INCREMENT,
           id_nuvemshop  varchar(255) DEFAULT NULL,
           codigo_erp  int(11) NOT NULL,
           nivel  enum('grupo','subgrupo') NOT NULL DEFAULT 'grupo',
           codigo_erp_pai  int(11) DEFAULT NULL,
           nome  varchar(255) NOT NULL,
           parent_id_nuvemshop  varchar(255) DEFAULT NULL,
           dados_categoria  text DEFAULT NULL,
           ultimo_envio  datetime DEFAULT '2001-01-01 01:00:00',
           created_at  timestamp NOT NULL DEFAULT current_timestamp(),
           updated_at  timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
          PRIMARY KEY ( id ),
          UNIQUE KEY categoria_erp  ( nivel , codigo_erp ),
          KEY id_nuvemshop  ( id_nuvemshop ) 
        ) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8mb4; `,

        /**
        `  CREATE TABLE IF NOT EXISTS  ${database_integration}.produtos  (
                 id  int(11) NOT NULL AUTO_INCREMENT,
                 erp_sku  varchar(100) NOT NULL,
                 shopify_product_id  varchar(255) DEFAULT NULL,
                 titulo  varchar(255) NOT NULL,
                 preco  decimal(10,2) DEFAULT 0.00,
                 sync_status  enum('pending','approved','synced','error','waiting_update') DEFAULT 'pending',
                 error_message  text DEFAULT NULL,
                 dados_produto  text DEFAULT NULL,
                 ultimo_envio_preco  datetime DEFAULT '2001-01-01 01:00:00',
                 ultimo_envio_estoque  datetime DEFAULT '2001-01-01 01:00:00',
                 created_at  timestamp NOT NULL DEFAULT current_timestamp(),
                 updated_at  timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
                 data_recad_erp  datetime DEFAULT '2001-01-01 01:00:00' COMMENT 'DATA_RECAD no sistema',
                PRIMARY KEY ( id )
                ) ENGINE=InnoDB AUTO_INCREMENT=10918 DEFAULT CHARSET=utf8mb4;  `,
        
       `CREATE TABLE  IF NOT EXISTS ${database_integration}.fotos_produtos  (
         id  int(11) NOT NULL AUTO_INCREMENT,
         erp_sku  varchar(100) NOT NULL,
         referencia  varchar(255) DEFAULT NULL,
         cod_barras  varchar(100) DEFAULT NULL,
         shopify_product_id  varchar(255) DEFAULT NULL,
         link  varchar(255) DEFAULT NULL,
         created_at  timestamp NULL DEFAULT current_timestamp(),
         updated_at  timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
         ativo  enum('S','N') DEFAULT 'S',
         id_postgres  varchar(255) DEFAULT NULL,
        PRIMARY KEY ( id ),
        UNIQUE KEY  erp_sku  ( erp_sku , link ),
        KEY  id_postgres  ( id_postgres )
      ) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=latin1;
`,
        `
        CREATE TABLE  IF NOT EXISTS  ${database_integration}.tokens  (
             id  int(11) NOT NULL AUTO_INCREMENT,
             token  varchar(255) DEFAULT NULL,
             refresh_token  varchar(255) DEFAULT NULL,
             expires_in  varchar(255) DEFAULT NULL,
             ult_atualizacao  timestamp NULL DEFAULT NULL,
            PRIMARY KEY ( id )
            ) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci ROW_FORMAT=DYNAMIC;

        `,
        ` 
        CREATE TABLE  IF NOT EXISTS ${database_integration}.locais  (
           id  int(11) NOT NULL AUTO_INCREMENT,
           id_shopify  varchar(255) NOT NULL,
           nome  varchar(255) NOT NULL,
           created_at  timestamp NULL DEFAULT current_timestamp(),
           updated_at  timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
           filial_erp  int(11) DEFAULT NULL,
          PRIMARY KEY ( id ),
          UNIQUE KEY  id_shopify  ( id_shopify )
        ) ENGINE=InnoDB AUTO_INCREMENT= 0 DEFAULT CHARSET=latin1;
          `,
           ` 
         CREATE TABLE  IF NOT EXISTS ${database_integration}.variantes_locais  (
         id  int(11) NOT NULL AUTO_INCREMENT,
         erp_sku  varchar(100) NOT NULL,
         variante_id  varchar(255) NOT NULL,
         inventoryItemId  varchar(255) DEFAULT NULL,
         id_local_shopify  varchar(255) NOT NULL,
         id_local  varchar(255) NOT NULL,
         estoque  decimal(10,2) DEFAULT 0.00,
         ultimo_envio_estoque  datetime DEFAULT '2001-01-01 01:00:00',
         created_at  timestamp NULL DEFAULT current_timestamp(),
         updated_at  timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        PRIMARY KEY ( id ),
        UNIQUE KEY  setor  ( variante_id , id_local_shopify ),
        KEY  id   ( id )
        ) ENGINE=InnoDB AUTO_INCREMENT=30717 DEFAULT CHARSET=latin1;
          `,
         `CREATE TABLE IF NOT EXISTS ${database_integration}.configuracoes  (
             id  int(11) NOT NULL AUTO_INCREMENT,
             atualizar_produtos enum('S','N') DEFAULT 'N',
             enviar_produtos  enum('S','N') DEFAULT 'N',
             enviar_estoque  enum('S','N') DEFAULT 'N',
             enviar_preco  enum('S','N') DEFAULT 'N',
             importar_pedidos enum('S','N') DEFAULT 'N',
             tabela_preco  int(10) DEFAULT 0,
             forma_pagamento  int(10) DEFAULT 1,
             setor int(10) DEFAULT 0,
             vendedor_pedido int(10) DEFAULT 0,
             ultimo_envio_preco  datetime DEFAULT '2001-01-01 01:00:00',
             ultimo_envio_estoque  datetime DEFAULT '2001-01-01 01:00:00',
             updated_at  timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
             ultimo_envio_produto datetime DEFAULT '2001-01-01 01:00:00',
            PRIMARY KEY ( id )
            ) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
                    
         `,
         `  
                CREATE TABLE IF NOT EXISTS ${database_integration}.variantes  (
                 id  int(11) NOT NULL AUTO_INCREMENT,
                 id_produto_pai  varchar(255) DEFAULT NULL,
                 variante_id  varchar(255) DEFAULT NULL,
                 erp_sku  varchar(100) NOT NULL,
                 inventoryItemId  varchar(255) DEFAULT NULL,
                 titulo  varchar(255) NOT NULL,
                 preco  decimal(10,2) DEFAULT 0.00,
                 sync_status  enum('pending','approved','synced','error','waiting_update') DEFAULT 'pending',
                 error_message  text DEFAULT NULL,
                 dados_produto  text DEFAULT NULL,
                 ultimo_envio_preco  datetime DEFAULT '2001-01-01 01:00:00',
                 ultimo_envio_estoque  datetime DEFAULT '2001-01-01 01:00:00',
                 created_at  timestamp NULL DEFAULT current_timestamp(),
                 updated_at  timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
                PRIMARY KEY ( id )
                ) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=latin1;
 `,
        `
          CREATE TABLE IF NOT EXISTS  ${database_integration}.pedidos (
                   id  int(11) NOT NULL AUTO_INCREMENT,
                   shopify_order_id  varchar(100) NOT NULL,
                   shopify_order_number  varchar(50) NOT NULL,
                   erp_order_id  varchar(100) DEFAULT NULL,
                   nome_cliente  varchar(255) DEFAULT NULL,
                   email_cliente  varchar(255) DEFAULT NULL,
                   preco_total  decimal(10,2) DEFAULT NULL,
                   sync_status  enum('pending_validation','approved','synced','error') DEFAULT 'pending_validation',
                   status_pagamento  enum('AUTHORIZED','EXPIRED','PAID','PARTIALLY_PAID','PARTIALLY_REFUNDED','PENDING','REFUNDED','VOIDED') DEFAULT 'PENDING',
                   status_atendimento  enum('FULFILLED','IN_PROGRESS','ON_HOLD','OPEN','PARTIALLY_FULFILLED','PENDING_FULFILLMENT','REQUEST_DECLINED','RESTOCKED','SCHEDULED','UNFULFILLED') DEFAULT 'UNFULFILLED',
                   error_message  text DEFAULT NULL,
                   dados_pedido  text DEFAULT NULL,
                   data_criacao  datetime DEFAULT '2000-01-01 01:00:00',
                   data_atualizacao  datetime DEFAULT '2000-01-01 01:00:00',
                   created_at  timestamp NOT NULL DEFAULT current_timestamp(),
                   updated_at  timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
                  PRIMARY KEY ( id ),
                  UNIQUE KEY  shopify_order_id ( shopify_order_id )
                ) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=latin1;
        `,
        
       ` CREATE TABLE IF NOT EXISTS  ${database_integration}.sync_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            referencia ENUM('product', 'order'),
            referencia_id INT, -- ID da tabela products ou orders
            action VARCHAR(255), -- ex: 'sent_to_shopify', 'received_from_shopify'
             message TEXT,
             dados_shopify longblob DEFAULT NULL,
             status  enum('error','sucess','warning') DEFAULT 'sucess',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
        );`,

        `CREATE TABLE IF NOT EXISTS  ${database_integration}.canais_venda  (
           id  int(11) NOT NULL AUTO_INCREMENT,
           id_shopify  varchar(255)  NOT NULL DEFAULT '',
           name  varchar(255) NOT NULL DEFAULT '',
           supportsFuturePublishing  varchar(255) NOT NULL DEFAULT '',
           created_at  timestamp NOT NULL DEFAULT current_timestamp(),
           updated_at  timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
          PRIMARY KEY ( id ),
          UNIQUE KEY  id_shopify  ( id_shopify )
        ) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=latin1; ` 
      */

        
    ]


        for ( const sql of tables){
            try{
                  const [ rows ] =    await conn2.query(sql);
            }catch(e){
                console.log(e);
            }
        }   
 
}


 