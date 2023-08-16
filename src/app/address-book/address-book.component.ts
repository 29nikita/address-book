import { Component, TemplateRef } from '@angular/core';
import { Firestore, collection, addDoc, collectionData, doc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { FormBuilder, Validators, FormGroup, FormControl, AbstractControl } from "@angular/forms";
import { Address } from './Address';

interface Node {
  key: Address;
  left: Node | null;
  right: Node | null;
}

@Component({
  selector: 'app-address-book',
  templateUrl: './address-book.component.html',
  styleUrls: ['./address-book.component.css']
})
export class AddressBookComponent {
  title = 'Address Book';
  addresses: Address[] = [];
  filteredAddresses: Address[] = [];
  modalRef!: BsModalRef;
  dialogTitle: string = "";
  selectedAddress: any;
  submitted: boolean = false;
  addButtonClicked: boolean = false;
  updateButtonClicked: boolean = false;
  root: Node | null = null;
  searchKey: string = "";
  p: number = 1;

  addressGroup: FormGroup = new FormGroup({
    Name: new FormControl(""),
    Mobile: new FormControl(""),
    Flat: new FormControl(""),
    Area: new FormControl(""),
    Pincode: new FormControl(""),
    City: new FormControl(""),
    State: new FormControl(""),
    Country: new FormControl("")
  });

  constructor(private firestore: Firestore,
    private modalService: BsModalService,
    private fb: FormBuilder) { }

  ngOnInit() {
    this.getData();

    this.addressGroup = this.fb.group({
      Name: ['', Validators.required],
      Mobile: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(10)]],
      Flat_No: [''],
      Area: ['', Validators.required],
      Pincode: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
      City: ['', Validators.required],
      State: ['', Validators.required],
      Country: ['', Validators.required],
    });
  }

  addData() {
    this.submitted = true;

    if (this.addressGroup.invalid) {
      return;
    } else {
      const obj = this.addressGroup;
      const collectionInstance = collection(this.firestore, "addresses");
      addDoc(collectionInstance, obj.value).then(() => {
        console.log("Data saved successfully");
      }).catch((err) => {
        console.log(err);
      })
    }

    this.onCancel();
  }

  getData() {
    const collectionInstance = collection(this.firestore, "addresses");
    collectionData(collectionInstance, { idField: 'id' }).subscribe((data) => {
      this.addresses = data as unknown as Address[];
      this.filteredAddresses = this.addresses;

      this.buildBinarySearchTree();
    });
  }

  updateData(id: string) {
    this.submitted = true;

    if (this.addressGroup.invalid) {
      this.addressGroup.markAllAsTouched();
      return;
    } else {
      const obj = this.addressGroup.getRawValue();
      const docInstance = doc(this.firestore, "addresses", id);
      const updatedData = {
        Name: obj.Name,
        Mobile: obj.Mobile,
        Flat_No: obj.Flat_No,
        Area: obj.Area,
        Pincode: obj.Pincode,
        City: obj.City,
        State: obj.State,
        Country: obj.Country
      }

      updateDoc(docInstance, updatedData).then(() => {
        console.log("Data updated");
      }).catch((err) => {
        console.log(err);
      });
    }
    this.onCancel();
  }

  deleteData(id: string) {
    const docInstance = doc(this.firestore, "addresses", id);
    deleteDoc(docInstance).then(() => {
      console.log("Data deleted");
    }).catch((err) => {
      console.log(err);
    })
  }

  onClickUpdateButton(template: TemplateRef<any>, title: any, address: any) {
    this.modalRef = this.modalService.show(template);
    this.dialogTitle = title;
    this.selectedAddress = address;
    this.updateButtonClicked = true;
    this.addButtonClicked = false;

    this.addressGroup = this.fb.group({
      Name: [this.selectedAddress.Name],
      Mobile: [this.selectedAddress.Mobile],
      Flat_No: [this.selectedAddress.Flat_No],
      Area: [this.selectedAddress.Area],
      Pincode: [this.selectedAddress.Pincode],
      City: [this.selectedAddress.City],
      State: [this.selectedAddress.State],
      Country: [this.selectedAddress.Country],
    });
  }

  onCancel() {
    this.modalRef.hide();
    this.addressGroup.reset();
    this.submitted = false;
  }

  onClickAdd(template: TemplateRef<any>, title: any) {
    this.modalRef = this.modalService.show(template);
    this.dialogTitle = title;
    this.addButtonClicked = true;
    this.updateButtonClicked = false;
  }

  get form(): { [key: string]: AbstractControl } {
    return this.addressGroup.controls;
  }

  buildBinarySearchTree(): void {
    this.addresses.forEach((address: any) => {
      this.root = this.insertNode(this.root, address);
    });
  }

  insertNode(root: Node | null, address: Address): Node {
    if (root === null) {
      return { key: address, left: null, right: null };
    }

    if (address.Name < root.key.Name) {
      root.left = this.insertNode(root.left, address);
    } else {
      root.right = this.insertNode(root.right, address);
    }

    return root;
  }

  searchAddress() {
    if (this.searchKey.trim() === "") {
      this.filteredAddresses = this.addresses;
    } else {
      this.filteredAddresses = [];
      this.searchNode(this.root, this.searchKey);
    }
  }

  searchNode(root: Node | null, searchKey: string): void {
    if (root === null) {
      return;
    }

    if (root.key.Name.toLowerCase().includes(searchKey)) {
      this.filteredAddresses.push(root.key);
    }

    if (searchKey < root.key.Name.toLowerCase()) {
      this.searchNode(root.left, searchKey);
    } else {
      this.searchNode(root.right, searchKey);
    }
  }
}
