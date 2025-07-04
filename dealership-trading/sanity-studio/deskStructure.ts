import {StructureBuilder} from 'sanity/structure'
import {
  Car,
  Users,
  Building2,
  ArrowRightLeft,
  Activity,
  MessageSquare,
  FileText,
  Settings
} from 'lucide-react'

export const deskStructure = (S: StructureBuilder, context: any) =>
  S.list()
    .title('Content')
    .items([
      // Vehicles organized by dealership
      S.listItem()
        .title('Vehicles by Dealership')
        .icon(Car)
        .child(
          S.documentTypeList('dealershipLocation')
            .title('Select Dealership')
            .filter('_type == "dealershipLocation" && active == true')
            .child(dealershipId =>
              S.documentList()
                .title('Vehicles')
                .filter('_type == "vehicle" && location._ref == $dealershipId')
                .params({dealershipId})
                .defaultOrdering([{field: 'stockNumber', direction: 'asc'}])
                .child(vehicleId =>
                  S.document()
                    .schemaType('vehicle')
                    .documentId(vehicleId)
                )
            )
        ),

      // All vehicles (traditional view)
      S.listItem()
        .title('All Vehicles')
        .icon(Car)
        .child(
          S.documentTypeList('vehicle')
            .title('All Vehicles')
            .filter('_type == "vehicle"')
            .child(vehicleId =>
              S.document()
                .schemaType('vehicle')
                .documentId(vehicleId)
            )
        ),

      S.divider(),

      // Transfers
      S.listItem()
        .title('Transfers')
        .icon(ArrowRightLeft)
        .child(
          S.list()
            .title('Transfers')
            .items([
              S.listItem()
                .title('Pending Requests')
                .child(
                  S.documentList()
                    .title('Pending Requests')
                    .filter('_type == "transfer" && status == "requested"')
                    .child(transferId =>
                      S.document()
                        .schemaType('transfer')
                        .documentId(transferId)
                    )
                ),
              S.listItem()
                .title('Approved')
                .child(
                  S.documentList()
                    .title('Approved Transfers')
                    .filter('_type == "transfer" && status == "approved"')
                    .child(transferId =>
                      S.document()
                        .schemaType('transfer')
                        .documentId(transferId)
                    )
                ),
              S.listItem()
                .title('In Transit')
                .child(
                  S.documentList()
                    .title('In Transit')
                    .filter('_type == "transfer" && status == "in-transit"')
                    .child(transferId =>
                      S.document()
                        .schemaType('transfer')
                        .documentId(transferId)
                    )
                ),
              S.listItem()
                .title('All Transfers')
                .child(
                  S.documentTypeList('transfer')
                    .title('All Transfers')
                )
            ])
        ),

      S.divider(),

      // Users
      S.listItem()
        .title('Users')
        .icon(Users)
        .child(
          S.list()
            .title('Users')
            .items([
              S.listItem()
                .title('By Role')
                .child(
                  S.list()
                    .title('Select Role')
                    .items([
                      S.listItem()
                        .title('Admins')
                        .child(
                          S.documentList()
                            .title('Admin Users')
                            .filter('_type == "user" && role == "admin"')
                        ),
                      S.listItem()
                        .title('Managers')
                        .child(
                          S.documentList()
                            .title('Manager Users')
                            .filter('_type == "user" && role == "manager"')
                        ),
                      S.listItem()
                        .title('Sales')
                        .child(
                          S.documentList()
                            .title('Sales Users')
                            .filter('_type == "user" && role == "sales"')
                        ),
                      S.listItem()
                        .title('Transport')
                        .child(
                          S.documentList()
                            .title('Transport Users')
                            .filter('_type == "user" && role == "transport"')
                        )
                    ])
                ),
              S.listItem()
                .title('All Users')
                .child(
                  S.documentTypeList('user')
                    .title('All Users')
                )
            ])
        ),

      // Dealership Locations
      S.listItem()
        .title('Dealership Locations')
        .icon(Building2)
        .child(
          S.documentTypeList('dealershipLocation')
            .title('Dealership Locations')
        ),

      S.divider(),

      // Activity & Comments
      S.listItem()
        .title('Activity')
        .icon(Activity)
        .child(
          S.documentTypeList('activity')
            .title('Activity Feed')
            .filter('_type == "activity"')
        ),

      S.listItem()
        .title('Comments')
        .icon(MessageSquare)
        .child(
          S.documentTypeList('comment')
            .title('Comments')
            .filter('_type == "comment"')
        ),

      S.divider(),

      // System
      S.listItem()
        .title('Import Logs')
        .icon(FileText)
        .child(
          S.documentTypeList('importLog')
            .title('Import Logs')
            .filter('_type == "importLog"')
        ),

      // Email Settings
      ...(S.documentTypeListItems().filter(
        listItem => listItem.getId() === 'emailSettings'
      ))
    ])