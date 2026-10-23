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

        `CREATE TABLE IF NOT EXISTS ${database_integration}.config (
             id int(11) NOT NULL AUTO_INCREMENT,
             modulo varchar(255) DEFAULT NULL,
             cron enum('S','N') DEFAULT 'N' COMMENT 'determina se deve executar tarefas cron',
             eventos enum('S','N') DEFAULT 'N' COMMENT 'determina se deve operar com eventos',
             expressao_cron varchar(15) DEFAULT '*/50 * * * *' COMMENT 'expressao cron para execução das tarefas',
            PRIMARY KEY ( id ),
            UNIQUE KEY uk_modulo ( modulo )
          ) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;  `,
           `
           INSERT IGNORE INTO  ${database_integration}.config  VALUES (1,'produtos','S','N','*/50 * * * *'),(2,'precos','S','N','*/50 * * * *'),(3,'categorias','S','N','*/50 * * * *'),(4,'estoque','S','N','*/50 * * * *'),(5,'pedidos','S','N','*/50 * * * *'),(6,'integracao','N','N','*/50 * * * *');
           `,
         `
         CREATE TABLE IF NOT EXISTS ${database_integration}.produtos (
           id int(11) NOT NULL AUTO_INCREMENT,
           id_variante_nuvemshop varchar(255) DEFAULT NULL COMMENT 'Id da veriante na nuvenshop',
           codigo_erp int(11) NOT NULL COMMENT 'Código da veriante no sistema',
           nome varchar(255) NOT NULL,
           dados_variante longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'JSON da variante enviada',
           dados_produto longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'JSON do produto enviado',
           preco decimal(10,2) DEFAULT 0.00 COMMENT 'Preço enviado',
           promocao decimal(10,2) DEFAULT 0.00 COMMENT 'Preço promocional enviado',
           estoque decimal(10,2) DEFAULT 0.00 COMMENT 'estoque enviado',
           ultimo_envio_estoque datetime DEFAULT '2001-01-01 01:00:00' COMMENT 'Data do último envio de estoque',
           ultimo_envio_preco datetime DEFAULT '2001-01-01 01:00:00' COMMENT 'Data do último envio do preço',
           ultimo_envio_produto datetime DEFAULT '2001-01-01 01:00:00' COMMENT 'Data do último envio do produto',
           created_at timestamp NOT NULL DEFAULT current_timestamp(),
           updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
           id_produto_nuvemshop varchar(255) DEFAULT NULL,
          PRIMARY KEY ( id ),
          UNIQUE KEY  codigo_erp  ( codigo_erp ),
          KEY  id_nuvemshop  ( id_variante_nuvemshop )
        ) ENGINE=InnoDB AUTO_INCREMENT=84 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `,
        `
        CREATE TABLE IF NOT EXISTS ${database_integration}.fotos_produtos (
          id int(11) NOT NULL AUTO_INCREMENT,
          id_foto_nuvemshop varchar(50) NOT NULL DEFAULT '',
          id_produto_nuvemshop varchar(50) NOT NULL DEFAULT '',
          src varchar(255) DEFAULT NULL,
          posicao int(10) NOT NULL DEFAULT 0,
          hash varchar(255) DEFAULT NULL,
          nome_arquivo varchar(255) DEFAULT NULL,
          codigo_produto_erp int(11) NOT NULL DEFAULT 0,
          id_foto_erp int(10) NOT NULL DEFAULT 0,
          created_at timestamp NOT NULL DEFAULT current_timestamp(),
          updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
          PRIMARY KEY ( id )
        ) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
        `,
        `CREATE TABLE IF NOT EXISTS ${database_integration}.pedidos  (
          id int(11) NOT NULL AUTO_INCREMENT,
          id_nuvemshop varchar(50) DEFAULT NULL,
          codigo_pedido_erp int(11) NOT NULL DEFAULT 0,
          nome_cliente varchar(255) DEFAULT NULL,
          codigo_cliente_erp int(255) DEFAULT NULL,
          status_nuvenshop varchar(50) DEFAULT NULL,
          total decimal(10,2) DEFAULT NULL,
          created_at timestamp NOT NULL DEFAULT current_timestamp(),
          updated_at timestamp NOT NULL DEFAULT '0000-00-00 00:00:00' ON UPDATE current_timestamp(),
          PRIMARY KEY ( id ),
          UNIQUE KEY  id_nuvemshop  ( id_nuvemshop , codigo_pedido_erp )
        ) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
        ` ,
       ` CREATE TABLE IF NOT EXISTS ${database_integration}.config_integracao  (
          id int(11) NOT NULL AUTO_INCREMENT,
          ultimo_envio_estoque datetime NOT NULL DEFAULT '2000-01-01 00:00:00',
          ultimo_envio_preco datetime NOT NULL DEFAULT '2000-01-01 00:00:00',
          ultimo_recebimento_pedido datetime NOT NULL DEFAULT '2000-01-01 00:00:00',
          codigo_vendedor int(11) NOT NULL DEFAULT 0,
          tabela_precos int(11) NOT NULL DEFAULT 0,
          setor int(10) DEFAULT 0,
          PRIMARY KEY ( id )
      ) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci; `,

       `  INSERT IGNORE INTO  ${database_integration}.config_integracao  
        SET  id = 1,  ultimo_envio_estoque = '2000-01-01 00:00:00', ultimo_envio_preco ='2000-01-01 00:00:00', ultimo_recebimento_pedido ='2000-01-01 00:00:00', codigo_vendedor =0, tabela_precos =0, setor =0
         ;
       `
    ]


        for ( const sql of tables){
            try{
                  const [ rows ] =    await conn2.query(sql);
            }catch(e){
                console.log(e);
            }
        }   

        }


 