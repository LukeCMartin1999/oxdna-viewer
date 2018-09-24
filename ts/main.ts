/// <reference path="./three/index.d.ts" />

var BACKBONE = 0
var NUCLEOSIDE = 1 
var BB_NS_CON = 2
var COM = 3
var SP_CON= 4

render();
// nucleotides store the information about position, orientation, ID
// Eventually there should be a way to pair them
// Everything is an Object3D, but only nucleotides have anything to render
class Nucleotide {
    local_id: number; //location on strand
    global_id: number; //location in world - all systems
    pos: THREE.Vector3; //not automatically updated
    neighbor3: Nucleotide | null;
    neighbor5: Nucleotide | null;
    pair: number;
    type: number | string; // 0:A 1:G 2:C 3:T/U
    my_strand: number;
    my_system: number;
    visual_object: THREE.Group; //contains 4 THREE.Mesh

    constructor(global_id: number, parent_system: number) {
        this.global_id = global_id;
        this.my_system = parent_system;

    };
};

// strands are made up of nucleotides
// strands have an ID within the system
class Strand {

    strand_id: number; //system location
    nucleotides: Nucleotide[] = [];
    my_system: System;
    strand_3objects: THREE.Group; //contains Nucleotide.visual_objects

    constructor(id: number, parent_system: System) {
        this.strand_id = id;
        this.my_system = parent_system;
        this.strand_3objects = new THREE.Group;
    };

    add_nucleotide(nuc: Nucleotide) {
        this.nucleotides.push(nuc);
        nuc.local_id = this.nucleotides.indexOf(nuc);
    };

};

// systems are made of strands
// systems can CRUD
class System {

    system_id: number;
    strands: Strand[] = [];
    CoM: THREE.Vector3; //System center of mass
    global_start_id: number; //1st nucleotide's global_id
    system_3objects: THREE.Group; //contains strand_3objects
    strand_to_material = {};
    base_to_material = {};
    constructor(id, start_id) {
        this.system_id = id;
        this.global_start_id = start_id;
        this.system_3objects = new THREE.Group;
    };

    system_length(): number {
        let count: number = 0;
        for (let i = 0; i < this.strands.length; i++) {
            count += this.strands[i].nucleotides.length;
        }
        return count;
    }

    add_strand(strand: Strand) {
        this.strands.push(strand);
    };

    setStrandMaterial(strand_to_material) {
        this.strand_to_material = strand_to_material;
    }
    setBaseMaterial(base_to_material) {
        this.base_to_material = base_to_material;
    }
};

// store rendering mode RNA  
let RNA_MODE = false; // By default we do DNA base spacing
// add base index visualistion
var nucleotide_3objects: THREE.Group[] = []; //contains references to all THREE.Group obj
var nucleotides: Nucleotide[] = []; //contains references to all nucleotides
//var selected_bases = {};
//initialize the space
var systems: System[] = [];
let sys_count: number = 0;
let strand_count: number = 0;
let nuc_count: number = 0;
var selected_bases: number[] = [];
var backbones: THREE.Object3D[] = [];

function cross(a1, a2, a3, b1, b2, b3) { //calculate cross product of 2 THREE.Vectors but takes coordinates as (x,y,z,x1,y1,z1)
    return [a2 * b3 - a3 * b2,
    a3 * b1 - a1 * b3,
    a1 * b2 - a2 * b1];
}
