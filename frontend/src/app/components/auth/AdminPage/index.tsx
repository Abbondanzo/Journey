import { UserActions } from '@app/actions';
import { User, UserRole } from '@app/models';
import * as React from 'react';
import { RouteComponentProps } from 'react-router';

export namespace AdminPage {
    export interface Props extends RouteComponentProps<any> {
        loggedInUser?: User;
        isLoading: boolean;
        users: User[];
        actions: UserActions;
    }
    export interface State {
        activeEdit?: User;
        newUser: {
            displayName: string;
            email: string;
            password: string;
            role: UserRole;
        };
    }
}

export class AdminPage extends React.Component<AdminPage.Props, AdminPage.State> {
    constructor(props: AdminPage.Props) {
        super(props);
        this.state = {
            activeEdit: undefined,
            newUser: {
                displayName: '',
                email: '',
                password: '',
                role: UserRole.USER
            }
        };
        this.handleInputChange = this.handleInputChange.bind(this);
        this.addUser = this.addUser.bind(this);
    }

    componentWillReceiveProps(props: AdminPage.Props) {
        // Automatically redirect to login if we're not logged in
        if (!props.loggedInUser && !props.isLoading) {
            this.props.history.replace('/login');
        }
    }

    handleInputChange(event: React.FormEvent<any>) {
        const name = event.currentTarget.name;
        const value = event.currentTarget.value;
        const newUser = { ...this.state.newUser };
        switch (name) {
            case 'email-field':
                newUser.email = value;
                this.setState({
                    newUser
                });
                break;
            case 'password-field':
                newUser.password = value;
                this.setState({
                    newUser
                });
                break;
            case 'name-field':
                newUser.displayName = value;
                this.setState({
                    newUser
                });
                break;
            case 'role-field':
                newUser.role = UserRole.convertStringToEnum(value);
                this.setState({
                    newUser
                });
                break;
        }
    }

    addUser() {
        this.props.actions.createUser(this.state.newUser);
    }

    getFollowerCount(user: User) {
        let followerCount = 0;
        const following = this.props.users.map((user) => {
            return user.profileDetails.following;
        });
        for (const followingList of following) {
            if (followingList.indexOf(user.uid) !== -1) {
                followerCount++;
            }
        }
        return followerCount;
    }

    getEditDisplayName() {
        const onChange = (event: any) => {
            const activeEdit = { ...this.state.activeEdit } as User;
            const value = event.target.value;
            activeEdit.displayName = value;
            this.setState({
                activeEdit
            });
        };
        return (
            <input
                className="form-control"
                type="text"
                value={this.state.activeEdit ? this.state.activeEdit.displayName || '' : ''}
                onChange={onChange}
            />
        );
    }

    getEditRole() {
        const onChange = (event: any) => {
            console.log(event.target);
        };
        return (
            <select
                className="form-control"
                value={this.state.activeEdit ? this.state.activeEdit.profileDetails.role || '' : ''}
                onChange={onChange}
            >
                <option value={UserRole.USER}>User</option>
                <option value={UserRole.MODERATOR}>Moderator</option>
                <option value={UserRole.ADMINISTRATOR}>Administrator</option>
            </select>
        );
    }

    render() {
        const saveUser = () => () => {
            if (this.state.activeEdit) {
                this.props.actions.updateUser(this.state.activeEdit);
            }
            this.setState({
                activeEdit: undefined
            });
        };
        const makeUserActive = (user: User) => () => {
            this.setState({
                activeEdit: user
            });
        };
        const deleteUser = (user: User) => () => {
            this.props.actions.deleteUser(user.uid);
        };
        return (
            <div className="admin-container">
                <div className="table-responsive list-group-item">
                    <h4>Users</h4>
                    <table className="table table-striped">
                        <thead>
                            <tr>
                                <th>User Email</th>
                                <th>User Name</th>
                                <th>Followers</th>
                                <th>Following</th>
                                <th>Role</th>
                                <th>&nbsp;</th>
                            </tr>
                        </thead>
                        <tbody>
                            {this.props.users.map((user: User, index: number) => {
                                const active =
                                    this.state.activeEdit && this.state.activeEdit.uid === user.uid;
                                return (
                                    <tr key={index}>
                                        <td>
                                            {user.email}
                                            {this.props.loggedInUser &&
                                            this.props.loggedInUser.uid === user.uid
                                                ? ' (you)'
                                                : ''}
                                        </td>
                                        <td>
                                            {active ? this.getEditDisplayName() : user.displayName}
                                        </td>
                                        <td>{this.getFollowerCount(user)}</td>
                                        <td>{user.profileDetails.following.length}</td>
                                        <td>
                                            {active
                                                ? this.getEditRole()
                                                : (user.profileDetails.role + '')
                                                      .charAt(0)
                                                      .toUpperCase() +
                                                  (user.profileDetails.role + '').substr(1)}
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-sm btn-success"
                                                onClick={active ? saveUser() : makeUserActive(user)}
                                            >
                                                {active ? 'Save' : 'Edit'}
                                            </button>
                                            <button
                                                className="btn btn-sm btn-danger"
                                                onClick={deleteUser(user)}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="list-group-item">
                    <h4>Add User</h4>
                    <div className="row">
                        <div className="col-sm-3 form-group">
                            <label htmlFor="email-field">Email</label>
                            <input
                                type="text"
                                name="email-field"
                                id="email-field"
                                className="form-control"
                                value={this.state.newUser.email}
                                onChange={this.handleInputChange}
                            />
                        </div>
                        <div className="col-sm-3 form-group">
                            <label htmlFor="password-field">Password</label>
                            <input
                                type="password"
                                name="password-field"
                                id="password-field"
                                className="form-control"
                                value={this.state.newUser.password}
                                onChange={this.handleInputChange}
                            />
                        </div>
                        <div className="col-sm-2 form-group">
                            <label htmlFor="name-field">Display Name</label>
                            <input
                                type="text"
                                name="name-field"
                                id="name-field"
                                className="form-control"
                                value={this.state.newUser.displayName}
                                onChange={this.handleInputChange}
                            />
                        </div>
                        <div className="col-sm-2 form-group">
                            <label htmlFor="role-field">Role</label>
                            <select
                                className="form-control"
                                value={this.state.newUser.role}
                                onChange={this.handleInputChange}
                                name="role-field"
                                id="role-field"
                            >
                                <option value={UserRole.USER}>User</option>
                                <option value={UserRole.MODERATOR}>Moderator</option>
                                <option value={UserRole.ADMINISTRATOR}>Administrator</option>
                            </select>
                        </div>
                        <div className="col-sm-2">
                            <button className="btn btn-primary" onClick={this.addUser}>
                                Add
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
