import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { AdminLoginComponent } from './admin-login/admin-login.component';
import { UserLoginComponent } from './user-login/user-login.component';
import { HomeComponent } from './home/home.component';
import { AddUserComponent } from './add-user/add-user.component';
import { AddProductComponent } from './add-product/add-product.component';
import { AddCategoryComponent } from './add-category/add-category.component';
import { ViewProductsComponent } from './view-products/view.products.component';
import { AboutComponent } from './about/about.component';
import { ViewUsersComponent } from './view-users/view-users.component';
import { ContactComponent } from './contact/contact';
import { CartComponent } from './cart/cart.component';
import { ShopComponent } from './shop/shop.component';
import { CreateUserGroupComponent } from './create-user-group/create-user-group.component';
import { ManageUserGroupsComponent } from './manage-user-groups/manage-user-groups.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'userlogin', component: UserLoginComponent },
  { path: 'adminlogin', component: AdminLoginComponent },
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent },
  { path: 'add-user', component: AddUserComponent, canActivate: [authGuard] },
  { path: 'add-product', component: AddProductComponent, canActivate: [authGuard] },
  { path: 'add-category', component: AddCategoryComponent, canActivate: [authGuard] },
  { path: 'view-products', component: ViewProductsComponent },
  { path: 'about', component: AboutComponent },
  { path: 'view-users', component: ViewUsersComponent, canActivate: [authGuard] },
  { path: 'contact', component: ContactComponent },
  { path: 'cart', component: CartComponent },
  { path: 'shop', component: ShopComponent },
  { path: 'create-user-group', component: CreateUserGroupComponent, canActivate: [authGuard] },
  { path: 'manage-user-groups', component: ManageUserGroupsComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'userlogin' }
];
